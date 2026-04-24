package com.edutrack.e_journal.service;

import com.edutrack.e_journal.dto.TeacherDto;
import com.edutrack.e_journal.dto.UserDto;
import com.edutrack.e_journal.entity.*;
import com.edutrack.e_journal.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class TeacherService {

    private final TeacherRepository  teacherRepository;
    private final UserRepository     userRepository;
    private final RoleRepository     roleRepository;
    private final SchoolRepository   schoolRepository;
    private final ScheduleRepository scheduleRepository;
    private final SubjectRepository  subjectRepository;
    private final SchoolService      schoolService;
    private final PasswordEncoder    passwordEncoder;

    public List<TeacherDto> getBySchool(Long schoolId, UserDetails principal) {
        // Verify that the authenticated headmaster has authority over the requested school
        schoolService.checkHeadmasterSchoolAccess(principal, schoolId);
        // Load all teachers belonging to the school and map them to DTOs
        return teacherRepository.findAllBySchool_Id(schoolId).stream()
                .map(this::toDto).toList();
    }

    public List<UserDto> getAvailable() {
        // Retrieve all users eligible for hiring/assignment and map them to a lightweight DTO
        return userRepository.findAvailableTeachers().stream()
                // Transform the managed User entities into UserDto objects for the API response
                .map(u -> new UserDto(u.getId(), u.getFirstName(), u.getLastName(),
                        u.getEmail(), u.getRole().getName().name(), null, null, u.getBio()))
                .toList();
    }

    public TeacherDto createAndHire(String firstName, String lastName, String email,
                                    String password, UserDetails principal) {
        if (userRepository.existsByEmail(email))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use");

        User headmaster = resolveUser(principal);
        School school   = schoolService.resolveHeadmasterSchool(headmaster);

        Role teacherRole = roleRepository.findByName(RoleEnum.TEACHER)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "TEACHER role not found"));

        User user = User.builder()
                .firstName(firstName)
                .lastName(lastName)
                .email(email)
                .passwordHash(passwordEncoder.encode(password))
                .role(teacherRole)
                .build();
        userRepository.save(user);

        Teacher teacher = Teacher.builder().id(user.getId()).user(user).school(school).build();
        teacherRepository.save(teacher);

        return toDto(teacher);
    }

    public UserDto hire(Long userId, UserDetails principal) {
        // Resolve the headmaster from the security context and identify their school
        User headmaster = resolveUser(principal);
        School school = schoolService.resolveHeadmasterSchool(headmaster);

        // Load the target user entity or fail if the ID is invalid
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        // Ensure the target user has the appropriate TEACHER role for this operation
        if (user.getRole().getName() != RoleEnum.TEACHER)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User is not a teacher");

        // Check if the user is already an active teacher in another school to prevent duplicate assignments
        Teacher teacher = teacherRepository.findById(userId).orElse(null);
        if (teacher != null && teacher.getSchool() != null)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Teacher is already assigned to a school");

        // Create a new Teacher record or update the existing one with the current school
        if (teacher == null) {
            teacher = Teacher.builder().id(userId).user(user).school(school).build();
        } else {
            teacher.setSchool(school);
        }

        // Persist the teacher assignment and return the populated DTO
        teacherRepository.save(teacher);
        return new UserDto(user.getId(), user.getFirstName(), user.getLastName(),
                user.getEmail(), user.getRole().getName().name(),
                school.getId(), school.getName(), user.getBio());
    }

    public void fire(Long teacherId, UserDetails principal) {
        // Identify the headmaster from the security context and resolve their associated school
        User headmaster = resolveUser(principal);
        School school = schoolService.resolveHeadmasterSchool(headmaster);

        // Load the managed Teacher entity or return 404 if the ID is invalid
        Teacher teacher = teacherRepository.findById(teacherId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Teacher not found"));

        // Verify the teacher's authority by checking if they belong to the headmaster's school
        if (teacher.getSchool() == null || !teacher.getSchool().getId().equals(school.getId()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Teacher does not belong to this school");

        // Remove the school association to effectively terminate the employment
        teacher.setSchool(null);
        teacherRepository.save(teacher);
    }

    public TeacherDto updateSalary(Long teacherId, BigDecimal salary, UserDetails principal) {
        // Update the salary for a specific teacher after verifying authority
        // Load the managed Teacher entity and validate the principal's access rights
        Teacher teacher = resolveOwnTeacher(teacherId, principal);
        // Apply the new salary value to the entity
        teacher.setSalary(salary);
        // Persist the changes to the database and return the updated DTO
        return toDto(teacherRepository.save(teacher));
    }

    public TeacherDto updateQualifications(Long teacherId, List<Long> subjectIds, UserDetails principal) {
        // Update the teacher's subject qualifications and return the updated DTO
        // Load the managed Teacher entity and verify the principal has authority to modify it
        Teacher teacher = resolveOwnTeacher(teacherId, principal);
        // Fetch all subject entities matching the provided IDs
        Set<Subject> subjects = new HashSet<>(subjectRepository.findAllById(subjectIds));
        // Update the teacher's qualification set with the new subjects
        teacher.setQualifications(subjects);
        // Persist changes to the database and map the updated entity to a DTO
        return toDto(teacherRepository.save(teacher));
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private Teacher resolveOwnTeacher(Long teacherId, UserDetails principal) {
        // Validates that the requested teacher belongs to the headmaster's school
        // Load the headmaster from the security context
        User headmaster = resolveUser(principal);
        // Retrieve the school managed by this headmaster
        School school = schoolService.resolveHeadmasterSchool(headmaster);
        // Load the managed Teacher entity or throw 404 if not found
        Teacher teacher = teacherRepository.findById(teacherId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Teacher not found"));
        // Check the teacher's authority on this school by verifying school membership
        if (teacher.getSchool() == null || !teacher.getSchool().getId().equals(school.getId()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Teacher does not belong to this school");
        return teacher;
    }

    private User resolveUser(UserDetails principal) {
        // Load the managed User entity from the database using the email from the authenticated principal
        return userRepository.findByEmail(principal.getUsername())
                // Throw an unauthorized exception if the user record cannot be found
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    private TeacherDto toDto(Teacher t) {
        // Maps the Teacher entity to a flattened DTO for API responses
        // Concatenate user profile names for a single display string
        String name  = t.getUser().getFirstName() + " " + t.getUser().getLastName();
        // Extract the primary contact email from the associated User entity
        String email = t.getUser().getEmail();
        // Transform the set of subject qualifications into a sorted list of DTO items
        List<TeacherDto.SubjectItem> qualifications = t.getQualifications().stream()
                .map(s -> new TeacherDto.SubjectItem(s.getId(), s.getName()))
                .sorted((a, b) -> a.getName().compareToIgnoreCase(b.getName()))
                .toList();
        // Calculate the number of unique school classes this teacher is currently assigned to
        int classCount = (int) scheduleRepository.findAllByTeacher_Id(t.getId()).stream()
                .map(s -> s.getSchoolClass().getId())
                .distinct()
                .count();
        // Construct the final DTO with all aggregated teacher information
        return new TeacherDto(t.getId(), name, email, t.getSalary(), qualifications, classCount);
    }
}
