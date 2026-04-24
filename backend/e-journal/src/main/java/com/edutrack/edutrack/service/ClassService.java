package com.edutrack.e_journal.service;

import com.edutrack.e_journal.dto.SchoolClassDto;
import com.edutrack.e_journal.dto.UserSummaryDto;
import com.edutrack.e_journal.entity.SchoolClass;
import com.edutrack.e_journal.entity.User;
import com.edutrack.e_journal.repository.ClassRepository;
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
public class ClassService {

    private final ClassRepository   classRepository;
    private final StudentRepository studentRepository;
    private final UserRepository    userRepository;
    private final SchoolService     schoolService;

    public List<SchoolClassDto> getAll(UserDetails principal) {
        // Determine if the current user has global administrative privileges
        boolean isAdmin = principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (isAdmin) {
            // Return all classes across all schools for the admin
            return classRepository.findAll().stream().map(this::toDto).toList();
        }
        // Load the headmaster entity associated with the authenticated user
        User headmaster = userRepository.findByEmail(principal.getUsername())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        // Identify the specific school managed by this headmaster
        Long schoolId = schoolService.resolveHeadmasterSchool(headmaster).getId();
        // Filter classes to only those belonging to the headmaster's school
        return classRepository.findAllBySchool_Id(schoolId).stream().map(this::toDto).toList();
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
