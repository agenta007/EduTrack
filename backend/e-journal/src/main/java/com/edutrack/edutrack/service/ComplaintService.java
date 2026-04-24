package com.edutrack.e_journal.service;

import com.edutrack.e_journal.dto.ComplaintDto;
import com.edutrack.e_journal.dto.ComplaintRequest;
import com.edutrack.e_journal.entity.Complaint;
import com.edutrack.e_journal.entity.Schedule;
import com.edutrack.e_journal.entity.Student;
import com.edutrack.e_journal.entity.User;
import com.edutrack.e_journal.repository.ComplaintRepository;
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
public class ComplaintService {

    private final ComplaintRepository  complaintRepository;
    private final StudentRepository    studentRepository;
    private final ScheduleRepository   scheduleRepository;
    private final UserRepository       userRepository;

    public List<ComplaintDto> getByClass(Long classId) {
        // Retrieve all complaints associated with the specified school class via the schedule relationship
        return complaintRepository.findAllBySchedule_SchoolClass_Id(classId).stream()
                // Map each complaint entity to its corresponding DTO for the API response
                .map(this::toDto).toList();
    }

    public List<ComplaintDto> getByCurrentStudent(UserDetails principal) {
        // Retrieve the authenticated student entity from the security principal
        User user = resolveUser(principal);
        // Fetch all complaints associated with the student's ID and map them to DTOs
        return complaintRepository.findAllByStudent_Id(user.getId()).stream()
                .map(this::toDto).toList();
    }

    public List<ComplaintDto> getByStudent(Long studentId) {
        // Retrieve all complaints associated with the specified student and map them to DTOs
        return complaintRepository.findAllByStudent_Id(studentId).stream()
                .map(this::toDto).toList();
    }

    public ComplaintDto create(ComplaintRequest req) {
        // Create a new behavioral complaint for a specific student and schedule entry
        // Load the managed Student entity or fail if the ID is invalid
        Student student = studentRepository.findById(req.getStudentId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Student not found"));
        // Load the specific Schedule entry to link the complaint to a lecture/class
        Schedule schedule = scheduleRepository.findById(req.getScheduleId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Schedule not found"));
        // Map the request DTO to a new Complaint entity using the builder pattern
        Complaint complaint = Complaint.builder()
                .student(student)
                .schedule(schedule)
                .description(req.getDescription())
                .date(LocalDate.parse(req.getDate()))
                .build();
        // Persist the complaint to the database and return the mapped DTO
        return toDto(complaintRepository.save(complaint));
    }

    public void delete(Long id) {
        // Remove a complaint by its ID after verifying existence
        if (!complaintRepository.existsById(id))
            // Return 404 if the complaint does not exist in the database
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Complaint not found");
        // Perform the deletion of the managed entity
        complaintRepository.deleteById(id);
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private User resolveUser(UserDetails principal) {
        // Load the managed User entity from the database using the email from the authenticated principal
        return userRepository.findByEmail(principal.getUsername())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    private ComplaintDto toDto(Complaint c) {
        // Map the Complaint entity to a ComplaintDto for API response
        // Concatenate student's first and last name from the associated User entity
        String studentName = c.getStudent().getUser().getFirstName()
                + " " + c.getStudent().getUser().getLastName();
        // Concatenate teacher's first and last name from the associated User entity via the Schedule
        String teacherName = c.getSchedule().getTeacher().getUser().getFirstName()
                + " " + c.getSchedule().getTeacher().getUser().getLastName();
        // Construct the DTO with flattened details to avoid deep nesting in the frontend
        return new ComplaintDto(
                c.getId(),
                c.getStudent().getId(),
                studentName,
                c.getSchedule().getId(),
                c.getSchedule().getSubject().getId(),
                c.getSchedule().getSubject().getName(),
                teacherName,
                c.getSchedule().getTerm(),
                c.getDate().toString(),
                c.getDescription()
        );
    }
}
