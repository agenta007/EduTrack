package com.edutrack.e_journal.service;

import com.edutrack.e_journal.dto.GradeDto;
import com.edutrack.e_journal.dto.GradeRequest;
import com.edutrack.e_journal.entity.*;
import com.edutrack.e_journal.repository.GradeRepository;
import com.edutrack.e_journal.repository.ScheduleRepository;
import com.edutrack.e_journal.repository.StudentRepository;
import com.edutrack.e_journal.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GradeServiceTest {

    @Mock GradeRepository    gradeRepository;
    @Mock StudentRepository  studentRepository;
    @Mock ScheduleRepository scheduleRepository;
    @Mock UserRepository     userRepository;

    @InjectMocks GradeService gradeService;

    private Student  student;
    private Schedule schedule;
    private Grade    grade;
    private Role     role;

    @BeforeEach
    void setUp() {
        role = new Role();
        role.setId(1L);
        role.setName(RoleEnum.TEACHER);

        User teacherUser = User.builder()
                .id(10L).firstName("John").lastName("Doe")
                .email("teacher@test.com").passwordHash("hash").role(role).build();

        User studentUser = User.builder()
                .id(20L).firstName("Anna").lastName("Smith")
                .email("student@test.com").passwordHash("hash").role(role).build();

        Teacher teacher = new Teacher();
        teacher.setId(10L);
        teacher.setUser(teacherUser);

        Subject subject = Subject.builder().id(5L).name("Mathematics").build();

        SchoolClass schoolClass = new SchoolClass();
        schoolClass.setId(3L);
        schoolClass.setName("10A");

        student = Student.builder().id(20L).user(studentUser).build();

        schedule = new Schedule();
        schedule.setId(7L);
        schedule.setTeacher(teacher);
        schedule.setSubject(subject);
        schedule.setSchoolClass(schoolClass);
        schedule.setTerm(1);

        grade = Grade.builder()
                .id(1L)
                .student(student)
                .schedule(schedule)
                .value(new BigDecimal("5.5"))
                .createdAt(LocalDateTime.now())
                .build();
    }

    // ── create ──────────────────────────────────────────────────────────────────

    @ParameterizedTest(name = "valid grade value {0}")
    @ValueSource(strings = {"2.0", "2.5", "3.0", "3.5", "4.0", "4.5", "5.0", "5.5", "6.0"})
    void create_validGradeValues_returnsDto(String value) {
        GradeRequest req = new GradeRequest();
        ReflectionTestUtils.setField(req, "studentId", 20L);
        ReflectionTestUtils.setField(req, "scheduleId", 7L);
        ReflectionTestUtils.setField(req, "value", new BigDecimal(value));

        when(studentRepository.findById(20L)).thenReturn(Optional.of(student));
        when(scheduleRepository.findById(7L)).thenReturn(Optional.of(schedule));
        when(gradeRepository.save(any(Grade.class))).thenReturn(grade);

        GradeDto dto = gradeService.create(req);

        assertThat(dto).isNotNull();
        assertThat(dto.getStudentId()).isEqualTo(20L);
        assertThat(dto.getSubjectName()).isEqualTo("Mathematics");
        verify(gradeRepository).save(any(Grade.class));
    }

    @ParameterizedTest(name = "invalid grade value {0}")
    @ValueSource(strings = {"1.0", "1.5", "7.0", "0.0", "3.3", "6.5"})
    void create_invalidGradeValue_throwsBadRequest(String value) {
        GradeRequest req = new GradeRequest();
        ReflectionTestUtils.setField(req, "studentId", 20L);
        ReflectionTestUtils.setField(req, "scheduleId", 7L);
        ReflectionTestUtils.setField(req, "value", new BigDecimal(value));

        assertThatThrownBy(() -> gradeService.create(req))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Grade must be one of");

        verifyNoInteractions(studentRepository, scheduleRepository, gradeRepository);
    }

    @Test
    void create_studentNotFound_throwsBadRequest() {
        GradeRequest req = new GradeRequest();
        ReflectionTestUtils.setField(req, "studentId", 99L);
        ReflectionTestUtils.setField(req, "scheduleId", 7L);
        ReflectionTestUtils.setField(req, "value", new BigDecimal("5.5"));

        when(studentRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> gradeService.create(req))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Student not found");

        verifyNoInteractions(gradeRepository);
    }

    @Test
    void create_scheduleNotFound_throwsBadRequest() {
        GradeRequest req = new GradeRequest();
        ReflectionTestUtils.setField(req, "studentId", 20L);
        ReflectionTestUtils.setField(req, "scheduleId", 99L);
        ReflectionTestUtils.setField(req, "value", new BigDecimal("5.5"));

        when(studentRepository.findById(20L)).thenReturn(Optional.of(student));
        when(scheduleRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> gradeService.create(req))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Schedule not found");

        verifyNoInteractions(gradeRepository);
    }

    // ── delete ──────────────────────────────────────────────────────────────────

    @Test
    void delete_existingGrade_deletesFromRepository() {
        when(gradeRepository.existsById(1L)).thenReturn(true);

        gradeService.delete(1L);

        verify(gradeRepository).deleteById(1L);
    }

    @Test
    void delete_nonExistentGrade_throwsNotFound() {
        when(gradeRepository.existsById(999L)).thenReturn(false);

        assertThatThrownBy(() -> gradeService.delete(999L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Grade not found");

        verify(gradeRepository, never()).deleteById(any());
    }

    // ── getByClass ───────────────────────────────────────────────────────────────

    @Test
    void getByClass_returnsAllGradesMappedToDto() {
        when(gradeRepository.findAllBySchedule_SchoolClass_Id(3L)).thenReturn(List.of(grade));

        List<GradeDto> result = gradeService.getByClass(3L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getStudentName()).isEqualTo("Anna Smith");
        assertThat(result.get(0).getTeacherName()).isEqualTo("John Doe");
        assertThat(result.get(0).getTerm()).isEqualTo(1);
    }

    @Test
    void getByClass_noGrades_returnsEmptyList() {
        when(gradeRepository.findAllBySchedule_SchoolClass_Id(3L)).thenReturn(List.of());

        assertThat(gradeService.getByClass(3L)).isEmpty();
    }

    // ── getByStudent ─────────────────────────────────────────────────────────────

    @Test
    void getByStudent_returnsGradesForStudent() {
        when(gradeRepository.findAllByStudent_Id(20L)).thenReturn(List.of(grade));

        List<GradeDto> result = gradeService.getByStudent(20L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getSubjectId()).isEqualTo(5L);
        assertThat(result.get(0).getValue()).isEqualTo("5.5");
    }

    // ── getByCurrentStudent ──────────────────────────────────────────────────────

    @Test
    void getByCurrentStudent_authenticatedStudent_returnsOwnGrades() {
        Role studentRole = new Role();
        studentRole.setName(RoleEnum.STUDENT);
        User studentUser = User.builder()
                .id(20L).email("student@test.com").passwordHash("hash")
                .firstName("Anna").lastName("Smith").role(studentRole).build();

        UserDetails principal = mock(UserDetails.class);
        when(principal.getUsername()).thenReturn("student@test.com");
        when(userRepository.findByEmail("student@test.com")).thenReturn(Optional.of(studentUser));
        when(gradeRepository.findAllByStudent_Id(20L)).thenReturn(List.of(grade));

        List<GradeDto> result = gradeService.getByCurrentStudent(principal);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getStudentId()).isEqualTo(20L);
    }

    @Test
    void getByCurrentStudent_unknownPrincipal_throwsUnauthorized() {
        UserDetails principal = mock(UserDetails.class);
        when(principal.getUsername()).thenReturn("ghost@test.com");
        when(userRepository.findByEmail("ghost@test.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> gradeService.getByCurrentStudent(principal))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("401");
    }

    // ── toDto mapping ────────────────────────────────────────────────────────────

    @Test
    void getByClass_dtoFieldsMatchEntity() {
        grade.setCreatedAt(null); // test null-safe createdAt
        when(gradeRepository.findAllBySchedule_SchoolClass_Id(3L)).thenReturn(List.of(grade));

        GradeDto dto = gradeService.getByClass(3L).get(0);

        assertThat(dto.getId()).isEqualTo(1L);
        assertThat(dto.getScheduleId()).isEqualTo(7L);
        assertThat(dto.getSubjectId()).isEqualTo(5L);
        assertThat(dto.getSubjectName()).isEqualTo("Mathematics");
        assertThat(dto.getCreatedAt()).isNull();
    }
}
