package com.edutrack.e_journal.service;

import com.edutrack.e_journal.dto.*;
import com.edutrack.e_journal.entity.*;
import com.edutrack.e_journal.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository    userRepository;
    private final RoleRepository    roleRepository;
    private final TeacherRepository teacherRepository;
    private final StudentRepository studentRepository;
    private final SchoolRepository  schoolRepository;
    private final PasswordEncoder   passwordEncoder;

    // Retrieve all users from the database and map them to their DTO representation
    public List<UserDto> getAllUsers() {
        // Fetch all managed User entities and transform the stream into a list of DTOs
        return ((List<User>) userRepository.findAll()).stream()
                .map(this::toUserDto)
                .toList();
    }

    public List<UserSummaryDto> getTeachersBySchool(Long schoolId) {
        // Retrieve all teachers associated with the specified school and map them to a lightweight DTO
        return teacherRepository.findAllBySchool_Id(schoolId).stream()
                // Transform each Teacher entity into a UserSummaryDto containing ID and full name
                .map(t -> new UserSummaryDto(t.getId(),
                        t.getUser().getFirstName() + " " + t.getUser().getLastName()))
                .toList();
    }

    public List<UserDto> getStudentsBySchool(Long schoolId) {
        // Retrieve all students belonging to the specified school and map them to user DTOs
        return studentRepository.findAllBySchool_Id(schoolId).stream()
                // Extract the managed User entity from each Student and convert to DTO
                .map(s -> toUserDto(s.getUser()))
                .toList();
    }

    public List<UserDto> getParentsBySchool(Long schoolId) {
        // Retrieve all parents associated with the specified school by traversing student relationships
        return studentRepository.findAllBySchool_IdAndParentIsNotNull(schoolId).stream()
                // Extract the parent User entity from each student record
                .map(s -> s.getParent())
                // Remove duplicate parent entries resulting from multiple students sharing one parent
                .distinct()
                // Map the managed User entities to their respective DTO representations
                .map(this::toUserDto)
                .toList();
    }

    public List<UserSummaryDto> getHeadmasters() {
        // Retrieve all users assigned the HEADMASTER role and map them to a lightweight summary DTO
        return userRepository.findAllByRole_Name(RoleEnum.HEADMASTER).stream()
                // Transform each User entity into a UserSummaryDto containing ID and full name
                .map(u -> new UserSummaryDto(u.getId(), u.getFirstName() + " " + u.getLastName()))
                .toList();
    }

    public ResponseEntity<byte[]> getPicture(Long id) {
        // Retrieve the user by ID or throw a 404 error if the user does not exist
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    
        // Check if the user has an uploaded profile picture
        if (user.getProfilePicture() == null) {
            return ResponseEntity.notFound().build();
        }
    
        // Return the image bytes with the correct MIME type from the user's profile metadata
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(user.getProfilePictureType()))
                .body(user.getProfilePicture());
    }

    public UserDto createUser(CreateUserRequest req) {
        // Check if the email is already registered to prevent duplicates
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use");
        }
        // Map the string role name to the corresponding Role entity
        Role role = resolveRole(req.getRole());
        // Build the new User entity with encoded credentials
        User user = User.builder()
                .firstName(req.getFirstName())
                .lastName(req.getLastName())
                .email(req.getEmail())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .role(role)
                .build();
        // Persist the new user and return the mapped DTO
        return toUserDto(userRepository.save(user));
    }

    public UserDto updateUser(Long id, UpdateUserRequest req) {
        // Update an existing user's profile information and credentials
        // Load the managed User entity from the database or fail if not found
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    
        // Map the updated fields from the request DTO to the entity
        user.setFirstName(req.getFirstName());
        user.setLastName(req.getLastName());
        user.setEmail(req.getEmail());
    
        // Convert the string role name to the corresponding UserRole enum
        user.setRole(resolveRole(req.getRole()));
    
        // Re-hash and update the password only if a new non-blank password is provided
        if (req.getPassword() != null && !req.getPassword().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        }
    
        // Persist changes to the database and return the updated user as a DTO
        return toUserDto(userRepository.save(user));
    }

    public void deleteUser(Long id) {
        // Verify the user exists before attempting deletion
        if (!userRepository.existsById(id)) {
            // Return 404 Not Found if the user ID does not match any record
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
        // Remove the managed user entity from the database
        userRepository.deleteById(id);
    }

    // ── Shared helpers ─────────────────────────────────────────────────────────

    public User resolveUser(UserDetails principal) {
        // Load the managed User entity from the database using the email from the authenticated principal
        return userRepository.findByEmail(principal.getUsername())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    public UserDto toUserDto(User u) {
        // Map a User entity to a UserDto, enriching it with school context based on the user's role
        Long schoolId = null;
        String schoolName = null;
        RoleEnum role = u.getRole().getName();

        if (role == RoleEnum.TEACHER) {
            // Load the teacher profile to retrieve their assigned school
            var t = teacherRepository.findById(u.getId()).orElse(null);
            if (t != null && t.getSchool() != null) {
                schoolId   = t.getSchool().getId();
                schoolName = t.getSchool().getName();
            }
        } else if (role == RoleEnum.STUDENT) {
            // Load the student profile to retrieve their enrolled school
            var s = studentRepository.findById(u.getId()).orElse(null);
            if (s != null && s.getSchool() != null) {
                schoolId   = s.getSchool().getId();
                schoolName = s.getSchool().getName();
            }
        } else if (role == RoleEnum.HEADMASTER) {
            // Find the school where this user is registered as the director
            School school = schoolRepository.findByDirector_Id(u.getId()).orElse(null);
            if (school != null) {
                schoolId   = school.getId();
                schoolName = school.getName();
            }
        }

        // Construct the final DTO with user details and resolved school information
        return new UserDto(u.getId(), u.getFirstName(), u.getLastName(), u.getEmail(),
                role.name(), schoolId, schoolName, u.getBio());
    }

    private Role resolveRole(String roleName) {
        // Convert a string role name into a managed Role entity
        RoleEnum roleEnum;
        try {
            // Parse the string into the corresponding RoleEnum constant
            roleEnum = RoleEnum.valueOf(roleName.toUpperCase());
        } catch (IllegalArgumentException e) {
            // Validate that the provided string matches a known role type
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid role: " + roleName);
        }
        // Load the managed Role entity from the database using the enum
        return roleRepository.findByName(roleEnum)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Role not found: " + roleName));
    }
}
