package com.edutrack.e_journal.service;

import com.edutrack.e_journal.dto.GradeDto;
import com.edutrack.e_journal.dto.GradeRequest;
import com.edutrack.e_journal.entity.Grade;
import com.edutrack.e_journal.entity.Schedule;
import com.edutrack.e_journal.entity.Student;
import com.edutrack.e_journal.entity.User;
import com.edutrack.e_journal.repository.GradeRepository;
import com.edutrack.e_journal.repository.ScheduleRepository;
import com.edutrack.e_journal.repository.StudentRepository;
import com.edutrack.e_journal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class GradeService {

    private static final Set<BigDecimal> VALID_VALUES = Set.of(
        new BigDecimal("2.0"), new BigDecimal("2.5"),
        new BigDecimal("3.0"), new BigDecimal("3.5"),
        new BigDecimal("4.0"), new BigDecimal("4.5"),
        new BigDecimal("5.0"), new BigDecimal("5.5"),
        new BigDecimal("6.0")
    );

    private final GradeRepository    gradeRepository;
    private final StudentRepository  studentRepository;
    private final ScheduleRepository scheduleRepository;
    private final UserRepository     userRepository;

    public List<GradeDto> getByClass(Long classId) {
        // Retrieve all grades associated with the specified school class and map them to DTOs
        return gradeRepository.findAllBySchedule_SchoolClass_Id(classId).stream()
                .map(this::toDto).toList();
    }

    public List<GradeDto> getByCurrentStudent(UserDetails principal) {
        // Retrieve the authenticated student entity from the security principal
        User user = resolveUser(principal);
        // Fetch all grades for the student and map the managed entities to DTOs
        return gradeRepository.findAllByStudent_Id(user.getId()).stream()
                .map(this::toDto).toList();
    }

    // Retrieve all grades associated with a specific student
    public List<GradeDto> getByStudent(Long studentId) {
        // Fetch grades from the database and map the managed Grade entities to DTOs
        return gradeRepository.findAllByStudent_Id(studentId).stream()
                .map(this::toDto).toList();
    }

    public GradeDto create(GradeRequest req) {
        // Validate the grade value against the allowed Bulgarian scale
        if (!VALID_VALUES.contains(req.getValue().setScale(1)))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Grade must be one of: 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6");
        // Load the managed Student entity or fail if the ID is invalid
        Student student = studentRepository.findById(req.getStudentId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Student not found"));
        // Load the managed Schedule entity to link the grade to a specific lesson
        Schedule schedule = scheduleRepository.findById(req.getScheduleId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Schedule not found"));
        // Map the request data to a new Grade entity using the builder pattern
        Grade grade = Grade.builder()
                .student(student)
                .schedule(schedule)
                .value(req.getValue())
                .build();
        // Persist the grade to the database and return the populated DTO
        return toDto(gradeRepository.save(grade));
    }

    public void delete(Long id) {
        // Remove a grade record by its primary key
        // Check if the grade exists in the database to prevent silent failures
        if (!gradeRepository.existsById(id))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Grade not found");
        // Perform the deletion of the managed entity
        gradeRepository.deleteById(id);
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private User resolveUser(UserDetails principal) {
        // Load the managed User entity from the database using the email from the authenticated principal
        return userRepository.findByEmail(principal.getUsername())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    private GradeDto toDto(Grade g) {
        // Map the Grade entity to a GradeDto for API response
        // Concatenate student's first and last name from the associated User entity
        String studentName = g.getStudent().getUser().getFirstName()
                + " " + g.getStudent().getUser().getLastName();
        // Concatenate teacher's first and last name from the associated User entity via the Schedule
        String teacherName = g.getSchedule().getTeacher().getUser().getFirstName()
                + " " + g.getSchedule().getTeacher().getUser().getLastName();
        // Construct the DTO with flattened data from the Grade, Student, Subject, and Schedule entities
        return new GradeDto(
                g.getId(),
                g.getStudent().getId(),
                studentName,
                g.getSchedule().getId(),
                g.getSchedule().getSubject().getId(),
                g.getSchedule().getSubject().getName(),
                teacherName,
                g.getSchedule().getTerm(),
                g.getValue().toPlainString(),
                g.getCreatedAt() != null ? g.getCreatedAt().toString() : null
        );
    }
}
