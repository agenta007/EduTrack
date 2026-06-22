package com.edutrack.e_journal.service;

import com.edutrack.e_journal.dto.CreateUserRequest;
import com.edutrack.e_journal.dto.UpdateUserRequest;
import com.edutrack.e_journal.dto.UserDto;
import com.edutrack.e_journal.entity.*;
import com.edutrack.e_journal.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock UserRepository    userRepository;
    @Mock RoleRepository    roleRepository;
    @Mock TeacherRepository teacherRepository;
    @Mock StudentRepository studentRepository;
    @Mock SchoolRepository  schoolRepository;
    @Mock PasswordEncoder   passwordEncoder;

    @InjectMocks UserService userService;

    private Role teacherRole;
    private Role studentRole;
    private Role headmasterRole;
    private Role adminRole;

    @BeforeEach
    void setUp() {
        teacherRole = new Role();
        teacherRole.setName(RoleEnum.TEACHER);

        studentRole = new Role();
        studentRole.setName(RoleEnum.STUDENT);

        headmasterRole = new Role();
        headmasterRole.setName(RoleEnum.HEADMASTER);

        adminRole = new Role();
        adminRole.setName(RoleEnum.ADMIN);
    }

    // ── createUser ───────────────────────────────────────────────────────────────

    @Test
    void createUser_duplicateEmail_throwsConflict() {
        CreateUserRequest req = new CreateUserRequest();
        ReflectionTestUtils.setField(req, "email", "existing@school.bg");
        ReflectionTestUtils.setField(req, "firstName", "First");
        ReflectionTestUtils.setField(req, "lastName", "Last");
        ReflectionTestUtils.setField(req, "password", "secret");
        ReflectionTestUtils.setField(req, "role", "TEACHER");

        when(userRepository.existsByEmail("existing@school.bg")).thenReturn(true);

        assertThatThrownBy(() -> userService.createUser(req))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Email already in use");

        verify(userRepository, never()).save(any());
    }

    @Test
    void createUser_validRequest_encodesPasswordAndReturnsDto() {
        CreateUserRequest req = new CreateUserRequest();
        ReflectionTestUtils.setField(req, "email", "new@school.bg");
        ReflectionTestUtils.setField(req, "firstName", "Maria");
        ReflectionTestUtils.setField(req, "lastName", "Ivanova");
        ReflectionTestUtils.setField(req, "password", "plaintext");
        ReflectionTestUtils.setField(req, "role", "TEACHER");

        User saved = User.builder()
                .id(1L).firstName("Maria").lastName("Ivanova")
                .email("new@school.bg").passwordHash("hashed").role(teacherRole).build();

        when(userRepository.existsByEmail("new@school.bg")).thenReturn(false);
        when(roleRepository.findByName(RoleEnum.TEACHER)).thenReturn(Optional.of(teacherRole));
        when(passwordEncoder.encode("plaintext")).thenReturn("hashed");
        when(userRepository.save(any(User.class))).thenReturn(saved);
        when(teacherRepository.findById(1L)).thenReturn(Optional.empty());

        UserDto dto = userService.createUser(req);

        assertThat(dto.getEmail()).isEqualTo("new@school.bg");
        assertThat(dto.getFirstName()).isEqualTo("Maria");
        verify(passwordEncoder).encode("plaintext");
        verify(userRepository).save(any(User.class));
    }

    @Test
    void createUser_invalidRole_throwsBadRequest() {
        CreateUserRequest req = new CreateUserRequest();
        ReflectionTestUtils.setField(req, "email", "x@school.bg");
        ReflectionTestUtils.setField(req, "firstName", "X");
        ReflectionTestUtils.setField(req, "lastName", "Y");
        ReflectionTestUtils.setField(req, "password", "pw");
        ReflectionTestUtils.setField(req, "role", "INVALID_ROLE");

        when(userRepository.existsByEmail("x@school.bg")).thenReturn(false);

        assertThatThrownBy(() -> userService.createUser(req))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Invalid role");
    }

    // ── deleteUser ───────────────────────────────────────────────────────────────

    @Test
    void deleteUser_existingUser_callsDeleteById() {
        when(userRepository.existsById(5L)).thenReturn(true);

        userService.deleteUser(5L);

        verify(userRepository).deleteById(5L);
    }

    @Test
    void deleteUser_nonExistentUser_throwsNotFound() {
        when(userRepository.existsById(999L)).thenReturn(false);

        assertThatThrownBy(() -> userService.deleteUser(999L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("User not found");

        verify(userRepository, never()).deleteById(any());
    }

    // ── updateUser ───────────────────────────────────────────────────────────────

    @Test
    void updateUser_notFound_throwsNotFound() {
        UpdateUserRequest req = new UpdateUserRequest();
        ReflectionTestUtils.setField(req, "firstName", "A");
        ReflectionTestUtils.setField(req, "lastName", "B");
        ReflectionTestUtils.setField(req, "email", "a@b.com");
        ReflectionTestUtils.setField(req, "role", "ADMIN");
        ReflectionTestUtils.setField(req, "password", null);

        when(userRepository.findById(42L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.updateUser(42L, req))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    void updateUser_blankPassword_doesNotRehash() {
        User existing = User.builder()
                .id(3L).firstName("Old").lastName("Name")
                .email("old@school.bg").passwordHash("existingHash").role(adminRole).build();

        UpdateUserRequest req = new UpdateUserRequest();
        ReflectionTestUtils.setField(req, "firstName", "New");
        ReflectionTestUtils.setField(req, "lastName", "Name");
        ReflectionTestUtils.setField(req, "email", "new@school.bg");
        ReflectionTestUtils.setField(req, "role", "ADMIN");
        ReflectionTestUtils.setField(req, "password", "");

        when(userRepository.findById(3L)).thenReturn(Optional.of(existing));
        when(roleRepository.findByName(RoleEnum.ADMIN)).thenReturn(Optional.of(adminRole));
        when(userRepository.save(existing)).thenReturn(existing);

        userService.updateUser(3L, req);

        verify(passwordEncoder, never()).encode(any());
    }

    @Test
    void updateUser_nonBlankPassword_rehashesPassword() {
        User existing = User.builder()
                .id(3L).firstName("Old").lastName("Name")
                .email("old@school.bg").passwordHash("oldHash").role(adminRole).build();

        UpdateUserRequest req = new UpdateUserRequest();
        ReflectionTestUtils.setField(req, "firstName", "Old");
        ReflectionTestUtils.setField(req, "lastName", "Name");
        ReflectionTestUtils.setField(req, "email", "old@school.bg");
        ReflectionTestUtils.setField(req, "role", "ADMIN");
        ReflectionTestUtils.setField(req, "password", "newSecret");

        when(userRepository.findById(3L)).thenReturn(Optional.of(existing));
        when(roleRepository.findByName(RoleEnum.ADMIN)).thenReturn(Optional.of(adminRole));
        when(passwordEncoder.encode("newSecret")).thenReturn("newHash");
        when(userRepository.save(existing)).thenReturn(existing);

        userService.updateUser(3L, req);

        verify(passwordEncoder).encode("newSecret");
        assertThat(existing.getPasswordHash()).isEqualTo("newHash");
    }

    // ── toUserDto — school resolution by role ────────────────────────────────────

    @Test
    void toUserDto_teacherWithSchool_populatesSchoolFields() {
        User user = User.builder()
                .id(10L).firstName("Ana").lastName("Georgieva")
                .email("ana@school.bg").passwordHash("h").role(teacherRole).build();

        School school = School.builder().id(1L).name("SOU Vasil Levski").build();
        Teacher teacher = new Teacher();
        teacher.setId(10L);
        teacher.setUser(user);
        teacher.setSchool(school);

        when(teacherRepository.findById(10L)).thenReturn(Optional.of(teacher));

        UserDto dto = userService.toUserDto(user);

        assertThat(dto.getSchoolId()).isEqualTo(1L);
        assertThat(dto.getSchoolName()).isEqualTo("SOU Vasil Levski");
    }

    @Test
    void toUserDto_teacherWithNoSchool_schoolFieldsNull() {
        User user = User.builder()
                .id(10L).firstName("Ana").lastName("Georgieva")
                .email("ana@school.bg").passwordHash("h").role(teacherRole).build();

        Teacher teacher = new Teacher();
        teacher.setId(10L);
        teacher.setUser(user);
        teacher.setSchool(null);

        when(teacherRepository.findById(10L)).thenReturn(Optional.of(teacher));

        UserDto dto = userService.toUserDto(user);

        assertThat(dto.getSchoolId()).isNull();
        assertThat(dto.getSchoolName()).isNull();
    }

    @Test
    void toUserDto_studentWithSchool_populatesSchoolFields() {
        User user = User.builder()
                .id(20L).firstName("Ivan").lastName("Petrov")
                .email("ivan@school.bg").passwordHash("h").role(studentRole).build();

        School school = School.builder().id(2L).name("Gymnazia Geo Milev").build();
        Student student = Student.builder().id(20L).user(user).school(school).build();

        when(studentRepository.findById(20L)).thenReturn(Optional.of(student));

        UserDto dto = userService.toUserDto(user);

        assertThat(dto.getSchoolId()).isEqualTo(2L);
        assertThat(dto.getSchoolName()).isEqualTo("Gymnazia Geo Milev");
    }

    @Test
    void toUserDto_headmasterWithSchool_populatesSchoolFields() {
        User user = User.builder()
                .id(30L).firstName("Director").lastName("Petkov")
                .email("director@school.bg").passwordHash("h").role(headmasterRole).build();

        School school = School.builder().id(3L).name("PMG Plovdiv").build();

        when(schoolRepository.findByDirector_Id(30L)).thenReturn(Optional.of(school));

        UserDto dto = userService.toUserDto(user);

        assertThat(dto.getSchoolId()).isEqualTo(3L);
        assertThat(dto.getSchoolName()).isEqualTo("PMG Plovdiv");
    }

    @Test
    void toUserDto_adminUser_schoolFieldsNull() {
        User user = User.builder()
                .id(1L).firstName("Admin").lastName("User")
                .email("admin@school.bg").passwordHash("h").role(adminRole).build();

        UserDto dto = userService.toUserDto(user);

        assertThat(dto.getSchoolId()).isNull();
        assertThat(dto.getSchoolName()).isNull();
        assertThat(dto.getRole()).isEqualTo("ADMIN");
    }

    // ── resolveUser ──────────────────────────────────────────────────────────────

    @Test
    void resolveUser_validPrincipal_returnsUser() {
        User user = User.builder()
                .id(5L).email("test@school.bg").passwordHash("h").role(adminRole).build();

        UserDetails principal = mock(UserDetails.class);
        when(principal.getUsername()).thenReturn("test@school.bg");
        when(userRepository.findByEmail("test@school.bg")).thenReturn(Optional.of(user));

        User result = userService.resolveUser(principal);

        assertThat(result.getId()).isEqualTo(5L);
    }

    @Test
    void resolveUser_unknownEmail_throwsUnauthorized() {
        UserDetails principal = mock(UserDetails.class);
        when(principal.getUsername()).thenReturn("ghost@school.bg");
        when(userRepository.findByEmail("ghost@school.bg")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.resolveUser(principal))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("401");
    }
}
