package com.edutrack.e_journal.service;

import com.edutrack.e_journal.dto.UserDto;
import com.edutrack.e_journal.entity.RoleEnum;
import com.edutrack.e_journal.entity.School;
import com.edutrack.e_journal.entity.Student;
import com.edutrack.e_journal.entity.User;
import com.edutrack.e_journal.repository.SchoolRepository;
import com.edutrack.e_journal.repository.StudentRepository;
import com.edutrack.e_journal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StudentService {

    private final StudentRepository studentRepository;
    private final UserRepository    userRepository;
    private final SchoolRepository  schoolRepository;

    public List<UserDto> getAvailable() {
        // Retrieve all students not currently enrolled in a class and map them to DTOs
        return userRepository.findAvailableStudents().stream()
                .map(u -> new UserDto(u.getId(), u.getFirstName(), u.getLastName(),
                        u.getEmail(), u.getRole().getName().name(), null, null, u.getBio()))
                .toList();
    }

    public UserDto enroll(Long userId, UserDetails principal) {
        // Enroll a user as a student in the headmaster's school
        // Load the headmaster performing the action and identify their associated school
        User headmaster = resolveUser(principal);
        School school = resolveHeadmasterSchool(headmaster);

        // Load the target user entity or fail if the ID is invalid
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        // Ensure the target user has the STUDENT role before proceeding
        if (user.getRole().getName() != RoleEnum.STUDENT)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User is not a student");

        // Check if the user is already linked to a student profile and prevent duplicate school enrollment
        Student student = studentRepository.findById(userId).orElse(null);
        if (student != null && student.getSchool() != null)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Student is already enrolled in a school");

        // Create a new Student record if none exists, otherwise update the existing student's school association
        if (student == null) {
            student = Student.builder().id(userId).user(user).school(school).build();
        } else {
            student.setSchool(school);
        }

        // Persist the changes to the student repository
        studentRepository.save(student);
        // Return the populated DTO containing user and school details
        return new UserDto(user.getId(), user.getFirstName(), user.getLastName(),
                user.getEmail(), user.getRole().getName().name(),
                school.getId(), school.getName(), user.getBio());
    }

    public void expel(Long studentId, UserDetails principal) {
        // Remove a student from the school's registry by clearing their school association
        // Load the headmaster from the security context
        User headmaster = resolveUser(principal);
        // Retrieve the school managed by the authenticated headmaster
        School school = resolveHeadmasterSchool(headmaster);

        // Load the managed Student entity or return 404 if not found
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));

        // Check the headmaster's authority on this student by verifying school membership
        if (student.getSchool() == null || !student.getSchool().getId().equals(school.getId()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Student does not belong to this school");

        // Clear the school relationship to finalize the expulsion
        student.setSchool(null);
        // Persist the changes to the database
        studentRepository.save(student);
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private User resolveUser(UserDetails principal) {
        // Load the managed User entity from the database using the email from the authenticated principal
        return userRepository.findByEmail(principal.getUsername())
                // Throw a 401 Unauthorized exception if the user cannot be found in the system
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    // Retrieve the school managed by the given headmaster
    private School resolveHeadmasterSchool(User headmaster) {
        // Query the repository for the school where this user is the director
        return schoolRepository.findByDirector_Id(headmaster.getId())
                // Throw a 400 Bad Request if the headmaster is not linked to a school
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "No school assigned to this headmaster"));
    }
}
