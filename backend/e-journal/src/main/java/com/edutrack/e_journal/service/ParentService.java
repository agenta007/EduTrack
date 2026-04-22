package com.edutrack.e_journal.service;

import com.edutrack.e_journal.dto.ParentDto;
import com.edutrack.e_journal.dto.UserDto;
import com.edutrack.e_journal.entity.RoleEnum;
import com.edutrack.e_journal.entity.School;
import com.edutrack.e_journal.entity.Student;
import com.edutrack.e_journal.entity.User;
import com.edutrack.e_journal.repository.RoleRepository;
import com.edutrack.e_journal.repository.SchoolRepository;
import com.edutrack.e_journal.repository.StudentRepository;
import com.edutrack.e_journal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ParentService {

    private final UserRepository    userRepository;
    private final StudentRepository studentRepository;
    private final SchoolRepository  schoolRepository;
    private final SchoolService     schoolService;
    private final RoleRepository    roleRepository;
    private final PasswordEncoder   passwordEncoder;

    public List<ParentDto> getBySchool(Long schoolId, UserDetails principal) {
        // Verify the authenticated headmaster has authority over the requested school
        schoolService.checkHeadmasterSchoolAccess(principal, schoolId);

        // Fetch all students belonging to the school who are already linked to a parent
        List<Student> studentsWithParent = studentRepository.findAllBySchool_IdAndParentIsNotNull(schoolId);

        // Maps to group parent entities and their respective children by parent ID
        Map<Long, User>                        parentById   = new LinkedHashMap<>();
        Map<Long, List<ParentDto.StudentItem>> childrenById = new LinkedHashMap<>();

        for (Student s : studentsWithParent) {
            User parent = s.getParent();
            // Track the parent entity to avoid duplicate processing
            parentById.put(parent.getId(), parent);
            // Aggregate student details into the list of children for this specific parent
            childrenById
                .computeIfAbsent(parent.getId(), k -> new ArrayList<>())
                .add(new ParentDto.StudentItem(
                        s.getId(),
                        s.getUser().getFirstName() + " " + s.getUser().getLastName()));
        }

        // Transform the grouped maps into a list of ParentDto objects
        return parentById.entrySet().stream()
                .map(e -> {
                    User p = e.getValue();
                    List<ParentDto.StudentItem> children = childrenById.get(e.getKey());
                    // Sort the children list alphabetically by name
                    children.sort((a, b) -> a.getName().compareToIgnoreCase(b.getName()));
                    return new ParentDto(p.getId(), p.getFirstName(), p.getLastName(), p.getEmail(), children);
                })
                .toList();
    }

    public List<UserDto> getAvailable() {
        // Retrieve all users with the PARENT role and map them to a lightweight DTO for the UI
        return userRepository.findAllByRole_Name(RoleEnum.PARENT).stream()
                .map(u -> new UserDto(u.getId(), u.getFirstName(), u.getLastName(),
                        u.getEmail(), RoleEnum.PARENT.name(), null, null, u.getBio()))
                .toList();
    }

    public ParentDto link(Long parentId, Long studentId, UserDetails principal) {
        // Associate a student with a parent, ensuring the student is not already linked to another parent
        // Load the managed Parent entity from the database
        User parent     = resolveParent(parentId);
        // Load the Student entity and verify the principal has authority over this student
        Student student = resolveOwnStudent(studentId, principal);
        // Check the student's current association to prevent duplicate parent links
        if (student.getParent() != null)
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Student already has a parent — unlink first");
        // Establish the relationship in the managed entity
        student.setParent(parent);
        // Persist the updated relationship to the database
        studentRepository.save(student);
        // Return the updated Parent DTO including the school context
        return toDto(parent, student.getSchool().getId());
    }

    public void unlink(Long parentId, Long studentId, UserDetails principal) {
        // Remove the association between a parent and a student
        // Verify the parent exists in the system
        resolveParent(parentId);
        // Load the managed Student entity and check the teacher's/headmaster's authority on this student
        Student student = resolveOwnStudent(studentId, principal);
        // Clear the foreign key relationship
        student.setParent(null);
        // Persist the detached relationship state to the database
        studentRepository.save(student);
    }

    public ParentDto update(Long parentId, String firstName, String lastName, String email,
                            UserDetails principal) {
        // Update the parent's personal details and return the updated DTO
        // Load the managed Parent entity by ID
        User parent = resolveParent(parentId);
        // Retrieve the school context for the authenticated headmaster
        School school = schoolService.resolveHeadmasterSchool(resolveUser(principal));
        // Apply updated profile information to the entity
        parent.setFirstName(firstName);
        parent.setLastName(lastName);
        parent.setEmail(email);
        // Persist changes to the database
        userRepository.save(parent);
        // Map the updated entity to a DTO including the school context
        return toDto(parent, school.getId());
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private User resolveParent(Long parentId) {
        // Load the managed User entity by ID or fail if not present
        User user = userRepository.findById(parentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        // Verify the user's authority/role matches the expected PARENT domain role
        if (user.getRole().getName() != RoleEnum.PARENT)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User is not a parent");
        return user;
    }

    private Student resolveOwnStudent(Long studentId, UserDetails principal) {
        // Retrieve the authenticated headmaster from the security context
        User headmaster = resolveUser(principal);
        // Load the school managed by this headmaster
        School school   = schoolService.resolveHeadmasterSchool(headmaster);
        // Load the managed Student entity or return 404 if not found
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));
        // Check the headmaster's authority on this student by verifying school membership
        if (student.getSchool() == null || !student.getSchool().getId().equals(school.getId()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Student does not belong to this school");
        return student;
    }

    private User resolveUser(UserDetails principal) {
        // Retrieve the managed User entity from the database using the email from the authenticated principal
        return userRepository.findByEmail(principal.getUsername())
                // Throw a 401 Unauthorized exception if the user cannot be found in the repository
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    private ParentDto toDto(User parent, Long schoolId) {
        // Map the parent entity and their linked students to a ParentDto for the API response
        // Retrieve all students associated with this parent from the repository
        List<ParentDto.StudentItem> children = studentRepository.findAllByParent_Id(parent.getId()).stream()
                // Ensure the student belongs to the requested school context
                .filter(s -> s.getSchool() != null && s.getSchool().getId().equals(schoolId))
                // Transform the Student entity into a lightweight StudentItem DTO
                .map(s -> new ParentDto.StudentItem(
                        s.getId(),
                        s.getUser().getFirstName() + " " + s.getUser().getLastName()))
                // Sort the children list alphabetically by name
                .sorted((a, b) -> a.getName().compareToIgnoreCase(b.getName()))
                .toList();
        // Construct the final DTO containing parent details and the filtered student list
        return new ParentDto(parent.getId(), parent.getFirstName(), parent.getLastName(),
                parent.getEmail(), children);
    }

    public ParentDto create(String firstName, String lastName, String email, Long schoolId, UserDetails principal) {
        // 1. Verify the authenticated headmaster has authority over this school
        schoolService.checkHeadmasterSchoolAccess(principal, schoolId);

        // 2. Check if a user with this email already exists
        if (userRepository.findByEmail(email).isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is already in use");
        }

        // 3. Create the new User entity
        User newParent = new User();
        newParent.setFirstName(firstName);
        newParent.setLastName(lastName);
        newParent.setEmail(email);

        newParent.setPasswordHash(passwordEncoder.encode("password"));
        newParent.setRole(roleRepository.findByName(RoleEnum.PARENT).orElseThrow());

        // 4. Save to the database
        User savedParent = userRepository.save(newParent);

        // 5. Return the mapped DTO
        return toDto(savedParent, schoolId);
    }
}
