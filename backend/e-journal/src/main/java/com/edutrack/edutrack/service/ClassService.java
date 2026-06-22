package com.edutrack.e_journal.service;

import com.edutrack.e_journal.dto.SchoolClassDto;
import com.edutrack.e_journal.dto.UserSummaryDto;
import com.edutrack.e_journal.entity.SchoolClass;
import com.edutrack.e_journal.entity.Teacher;
import com.edutrack.e_journal.entity.User;
import com.edutrack.e_journal.repository.ClassRepository;
import com.edutrack.e_journal.repository.StudentRepository;
import com.edutrack.e_journal.repository.TeacherRepository;
import com.edutrack.e_journal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ClassService {

    private final ClassRepository   classRepository;
    private final StudentRepository studentRepository;
    private final TeacherRepository teacherRepository;
    private final UserRepository    userRepository;
    private final SchoolService     schoolService;

    public List<SchoolClassDto> getAll(UserDetails principal) {
        // Admins see every class across all schools
        if (hasRole(principal, "ROLE_ADMIN")) {
            return classRepository.findAll().stream().map(this::toDto).toList();
        }

        // Load the authenticated user; required for both teacher and headmaster scoping
        User user = userRepository.findByEmail(principal.getUsername())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        // Teachers are scoped to the classes of the school they are assigned to
        if (hasRole(principal, "ROLE_TEACHER")) {
            Teacher teacher = teacherRepository.findById(user.getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN,
                            "No teacher profile for this user"));
            // A teacher not yet assigned to a school has no classes to show
            if (teacher.getSchool() == null) return List.of();
            return classRepository.findAllBySchool_Id(teacher.getSchool().getId())
                    .stream().map(this::toDto).toList();
        }

        // Otherwise treat the user as a headmaster: classes of the school they direct
        Long schoolId = schoolService.resolveHeadmasterSchool(user).getId();
        return classRepository.findAllBySchool_Id(schoolId).stream().map(this::toDto).toList();
    }

    private boolean hasRole(UserDetails principal, String role) {
        // Check whether the authenticated principal carries the given granted authority
        return principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(role));
    }

    public List<SchoolClassDto> getBySchool(Long schoolId) {
        // Retrieve all school classes associated with the specified school ID and map them to DTOs
        return classRepository.findAllBySchool_Id(schoolId).stream()
                .map(this::toDto).toList();
    }

    public SchoolClassDto getById(Long id) {
        // Retrieve the school class by its primary key
        return classRepository.findById(id)
                // Map the managed SchoolClass entity to a DTO for the API response
                .map(this::toDto)
                // Throw a 404 Not Found exception if the class does not exist in the database
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Class not found"));
    }

    public List<UserSummaryDto> getStudents(Long classId) {
        // Retrieve all students belonging to the specified school class and map them to a lightweight DTO
        return studentRepository.findAllBySchoolClass_Id(classId).stream()
                // Transform each Student entity into a UserSummaryDto containing ID and full name
                .map(s -> new UserSummaryDto(
                        s.getId(),
                        s.getUser().getFirstName() + " " + s.getUser().getLastName()))
                .toList();
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private SchoolClassDto toDto(SchoolClass c) {
        // Map the managed SchoolClass entity to a DTO for API response
        return new SchoolClassDto(c.getId(), c.getName(), c.getSchoolYear(),
                c.getSchool().getId(), c.getSchool().getName());
    }
}
