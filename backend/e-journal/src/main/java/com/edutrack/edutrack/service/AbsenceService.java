package com.edutrack.e_journal.service;

import com.edutrack.e_journal.dto.AbsenceDto;
import com.edutrack.e_journal.dto.AbsenceRequest;
import com.edutrack.e_journal.entity.Absence;
import com.edutrack.e_journal.entity.Schedule;
import com.edutrack.e_journal.entity.Student;
import com.edutrack.e_journal.entity.User;
import com.edutrack.e_journal.repository.AbsenceRepository;
import com.edutrack.e_journal.repository.ScheduleRepository;
import com.edutrack.e_journal.repository.StudentRepository;
import com.edutrack.e_journal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AbsenceService {

    private final AbsenceRepository  absenceRepository;
    private final StudentRepository  studentRepository;
    private final ScheduleRepository scheduleRepository;
    private final UserRepository     userRepository;

    public List<AbsenceDto> getByClass(Long classId) {
        // Retrieve all absences associated with the specified school class and map them to DTOs
        return absenceRepository.findAllBySchedule_SchoolClass_Id(classId).stream()
                .map(this::toDto).toList();
    }

    public List<AbsenceDto> getByCurrentStudent(UserDetails principal) {
        // Retrieve the authenticated student entity from the security principal
        User user = resolveUser(principal);
        // Fetch all absences for the student and map the managed entities to DTOs
        return absenceRepository.findAllByStudent_Id(user.getId()).stream()
                .map(this::toDto).toList();
    }

    public List<AbsenceDto> getByStudent(Long studentId) {
        // Retrieve all absences for the specified student and map them to DTOs
        return absenceRepository.findAllByStudent_Id(studentId).stream()
                .map(this::toDto).toList();
    }

    public AbsenceDto create(AbsenceRequest req) {
        // Register a new absence record for a specific student and schedule entry
        // Load the managed Student entity or fail if the ID is invalid
        Student student = studentRepository.findById(req.getStudentId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Student not found"));
        // Load the managed Schedule entity or fail if the ID is invalid
        Schedule schedule = scheduleRepository.findById(req.getScheduleId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Schedule not found"));
        // Map the request data to a new Absence entity using the builder pattern
        Absence absence = Absence.builder()
                .student(student)
                .schedule(schedule)
                .date(LocalDate.parse(req.getDate()))
                .build();
        // Persist the new absence to the database and return the mapped DTO
        return toDto(absenceRepository.save(absence));
    }

    public AbsenceDto toggleExcuse(Long id) {
        // Flip the excused status of an existing absence record
        // Load the managed Absence entity or throw 404 if not found
        Absence absence = absenceRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Absence not found"));
    
        // Invert the current boolean state of the excused flag
        absence.setIsExcused(!absence.getIsExcused());
    
        // Persist the changes and map the updated entity to a DTO
        return toDto(absenceRepository.save(absence));
    }

    public void delete(Long id) {
        // Remove an absence record by its primary key
        // Verify the absence exists in the database before attempting deletion
        if (!absenceRepository.existsById(id))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Absence not found");
        // Perform the deletion of the managed entity
        absenceRepository.deleteById(id);
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private User resolveUser(UserDetails principal) {
        // Retrieve the managed User entity from the database using the email from the authenticated principal
        return userRepository.findByEmail(principal.getUsername())
                // Throw a 401 Unauthorized error if the user record cannot be found
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    private AbsenceDto toDto(Absence a) {
        // Map the Absence entity to a flattened AbsenceDto for API consumption
        // Construct the full name of the student from the associated User entity
        String studentName = a.getStudent().getUser().getFirstName()
                + " " + a.getStudent().getUser().getLastName();
        // Construct the full name of the teacher from the associated Schedule and User entities
        String teacherName = a.getSchedule().getTeacher().getUser().getFirstName()
                + " " + a.getSchedule().getTeacher().getUser().getLastName();
        // Assemble the DTO with IDs, names, and relevant metadata from the managed Absence entity
        return new AbsenceDto(
                a.getId(),
                a.getStudent().getId(),
                studentName,
                a.getSchedule().getId(),
                a.getSchedule().getSubject().getId(),
                a.getSchedule().getSubject().getName(),
                teacherName,
                a.getSchedule().getTerm(),
                a.getDate().toString(),
                a.getIsExcused()
        );
    }
}
