package com.edutrack.e_journal.service;

import com.edutrack.e_journal.dto.AbsenceDto;
import com.edutrack.e_journal.dto.AbsenceRequest;
import com.edutrack.e_journal.entity.*;
import com.edutrack.e_journal.repository.AbsenceRepository;
import com.edutrack.e_journal.repository.ScheduleRepository;
import com.edutrack.e_journal.repository.StudentRepository;
import com.edutrack.e_journal.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AbsenceServiceTest {

    @Mock AbsenceRepository  absenceRepository;
    @Mock StudentRepository  studentRepository;
    @Mock ScheduleRepository scheduleRepository;
    @Mock UserRepository     userRepository;

    @InjectMocks AbsenceService absenceService;

    private Student  student;
    private Schedule schedule;
    private Absence  absence;

    @BeforeEach
    void setUp() {
        Role role = new Role();
        role.setName(RoleEnum.TEACHER);

        User teacherUser = User.builder()
                .id(10L).firstName("Maria").lastName("Ivanova")
                .email("teacher@school.bg").passwordHash("h").role(role).build();

        User studentUser = User.builder()
                .id(20L).firstName("Ivan").lastName("Petrov")
                .email("student@school.bg").passwordHash("h").role(role).build();

        Teacher teacher = new Teacher();
        teacher.setId(10L);
        teacher.setUser(teacherUser);

        Subject subject = Subject.builder().id(3L).name("History").build();

        SchoolClass schoolClass = new SchoolClass();
        schoolClass.setId(2L);

        student = Student.builder().id(20L).user(studentUser).build();

        schedule = new Schedule();
        schedule.setId(5L);
        schedule.setTeacher(teacher);
        schedule.setSubject(subject);
        schedule.setSchoolClass(schoolClass);
        schedule.setTerm(2);

        absence = Absence.builder()
                .id(1L)
                .student(student)
                .schedule(schedule)
                .date(LocalDate.of(2026, 3, 10))
                .isExcused(false)
                .build();
    }

    // ── create ──────────────────────────────────────────────────────────────────

    @Test
    void create_validRequest_persistsAndReturnsDto() {
        AbsenceRequest req = new AbsenceRequest();
        ReflectionTestUtils.setField(req, "studentId", 20L);
        ReflectionTestUtils.setField(req, "scheduleId", 5L);
        ReflectionTestUtils.setField(req, "date", "2026-03-10");

        when(studentRepository.findById(20L)).thenReturn(Optional.of(student));
        when(scheduleRepository.findById(5L)).thenReturn(Optional.of(schedule));
        when(absenceRepository.save(any(Absence.class))).thenReturn(absence);

        AbsenceDto dto = absenceService.create(req);

        assertThat(dto.getStudentId()).isEqualTo(20L);
        assertThat(dto.getDate()).isEqualTo("2026-03-10");
        assertThat(dto.getExcused()).isFalse();
        assertThat(dto.getStudentName()).isEqualTo("Ivan Petrov");
        assertThat(dto.getTeacherName()).isEqualTo("Maria Ivanova");
        verify(absenceRepository).save(any(Absence.class));
    }

    @Test
    void create_studentNotFound_throwsBadRequest() {
        AbsenceRequest req = new AbsenceRequest();
        ReflectionTestUtils.setField(req, "studentId", 99L);
        ReflectionTestUtils.setField(req, "scheduleId", 5L);
        ReflectionTestUtils.setField(req, "date", "2026-03-10");

        when(studentRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> absenceService.create(req))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Student not found");

        verifyNoInteractions(absenceRepository);
    }

    @Test
    void create_scheduleNotFound_throwsBadRequest() {
        AbsenceRequest req = new AbsenceRequest();
        ReflectionTestUtils.setField(req, "studentId", 20L);
        ReflectionTestUtils.setField(req, "scheduleId", 99L);
        ReflectionTestUtils.setField(req, "date", "2026-03-10");

        when(studentRepository.findById(20L)).thenReturn(Optional.of(student));
        when(scheduleRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> absenceService.create(req))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Schedule not found");

        verifyNoInteractions(absenceRepository);
    }

    // ── toggleExcuse ─────────────────────────────────────────────────────────────

    @Test
    void toggleExcuse_unexcusedAbsence_becomesExcused() {
        absence.setIsExcused(false);
        Absence saved = Absence.builder()
                .id(1L).student(student).schedule(schedule)
                .date(absence.getDate()).isExcused(true).build();

        when(absenceRepository.findById(1L)).thenReturn(Optional.of(absence));
        when(absenceRepository.save(absence)).thenReturn(saved);

        AbsenceDto dto = absenceService.toggleExcuse(1L);

        assertThat(dto.getExcused()).isTrue();
        assertThat(absence.getIsExcused()).isTrue(); // entity mutated in place
    }

    @Test
    void toggleExcuse_excusedAbsence_becomesUnexcused() {
        absence.setIsExcused(true);
        Absence saved = Absence.builder()
                .id(1L).student(student).schedule(schedule)
                .date(absence.getDate()).isExcused(false).build();

        when(absenceRepository.findById(1L)).thenReturn(Optional.of(absence));
        when(absenceRepository.save(absence)).thenReturn(saved);

        AbsenceDto dto = absenceService.toggleExcuse(1L);

        assertThat(dto.getExcused()).isFalse();
    }

    @Test
    void toggleExcuse_notFound_throwsNotFound() {
        when(absenceRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> absenceService.toggleExcuse(999L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Absence not found");
    }

    // ── delete ──────────────────────────────────────────────────────────────────

    @Test
    void delete_existingAbsence_deletesFromRepository() {
        when(absenceRepository.existsById(1L)).thenReturn(true);

        absenceService.delete(1L);

        verify(absenceRepository).deleteById(1L);
    }

    @Test
    void delete_nonExistentAbsence_throwsNotFound() {
        when(absenceRepository.existsById(999L)).thenReturn(false);

        assertThatThrownBy(() -> absenceService.delete(999L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Absence not found");

        verify(absenceRepository, never()).deleteById(any());
    }

    // ── getByClass ───────────────────────────────────────────────────────────────

    @Test
    void getByClass_returnsMappedDtos() {
        when(absenceRepository.findAllBySchedule_SchoolClass_Id(2L)).thenReturn(List.of(absence));

        List<AbsenceDto> result = absenceService.getByClass(2L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getSubjectName()).isEqualTo("History");
        assertThat(result.get(0).getTerm()).isEqualTo(2);
    }

    @Test
    void getByClass_noAbsences_returnsEmptyList() {
        when(absenceRepository.findAllBySchedule_SchoolClass_Id(2L)).thenReturn(List.of());

        assertThat(absenceService.getByClass(2L)).isEmpty();
    }

    // ── getByStudent ─────────────────────────────────────────────────────────────

    @Test
    void getByStudent_returnsDtosForStudent() {
        when(absenceRepository.findAllByStudent_Id(20L)).thenReturn(List.of(absence));

        List<AbsenceDto> result = absenceService.getByStudent(20L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getScheduleId()).isEqualTo(5L);
    }

    // ── getByCurrentStudent ──────────────────────────────────────────────────────

    @Test
    void getByCurrentStudent_authenticatedStudent_returnsOwnAbsences() {
        Role role = new Role();
        role.setName(RoleEnum.STUDENT);
        User studentUser = User.builder()
                .id(20L).email("student@school.bg").passwordHash("h")
                .firstName("Ivan").lastName("Petrov").role(role).build();

        UserDetails principal = mock(UserDetails.class);
        when(principal.getUsername()).thenReturn("student@school.bg");
        when(userRepository.findByEmail("student@school.bg")).thenReturn(Optional.of(studentUser));
        when(absenceRepository.findAllByStudent_Id(20L)).thenReturn(List.of(absence));

        List<AbsenceDto> result = absenceService.getByCurrentStudent(principal);

        assertThat(result).hasSize(1);
    }

    @Test
    void getByCurrentStudent_unknownPrincipal_throwsUnauthorized() {
        UserDetails principal = mock(UserDetails.class);
        when(principal.getUsername()).thenReturn("nobody@test.com");
        when(userRepository.findByEmail("nobody@test.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> absenceService.getByCurrentStudent(principal))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("401");
    }
}
