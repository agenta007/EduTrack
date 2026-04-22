package com.edutrack.e_journal.controller;

import com.edutrack.e_journal.dto.*;
import com.edutrack.e_journal.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "Admin user management — CRUD, role assignment, and school filtering")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final UserService userService;

    @Operation(summary = "List all users", description = "Returns every user in the system. ADMIN only.")
    @ApiResponse(responseCode = "200", description = "User list returned")
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserDto> getAll() {
        // Retrieve the full list of users from the service layer
        return userService.getAllUsers();
    }

    @Operation(summary = "List teachers at a school", description = "Returns id + full name for every teacher assigned to the given school. Accessible by ADMIN and HEADMASTER.")
    @ApiResponse(responseCode = "200", description = "Teacher list returned")
    @GetMapping("/teachers/school/{schoolId}")
    @PreAuthorize("hasAnyRole('ADMIN','HEADMASTER')")
    public List<UserSummaryDto> getTeachersBySchool(
            @Parameter(description = "School ID") @PathVariable Long schoolId) {
        // Fetch a summary list of all users with the TEACHER role belonging to the specified school
        return userService.getTeachersBySchool(schoolId);
    }

    @Operation(summary = "List students at a school", description = "Returns full user profiles for every student enrolled in the given school. Accessible by ADMIN and HEADMASTER.")
    @ApiResponse(responseCode = "200", description = "Student list returned")
    @GetMapping("/students/school/{schoolId}")
    @PreAuthorize("hasAnyRole('ADMIN','HEADMASTER')")
    public List<UserDto> getStudentsBySchool(
            @Parameter(description = "School ID") @PathVariable Long schoolId) {
        // Fetch all student user profiles associated with the specified school
        return userService.getStudentsBySchool(schoolId);
    }

    @Operation(summary = "List parents at a school", description = "Returns full user profiles for parents whose children are enrolled in the given school. Accessible by ADMIN and HEADMASTER.")
    @ApiResponse(responseCode = "200", description = "Parent list returned")
    @GetMapping("/parents/school/{schoolId}")
    @PreAuthorize("hasAnyRole('ADMIN','HEADMASTER')")
    public List<UserDto> getParentsBySchool(
            @Parameter(description = "School ID") @PathVariable Long schoolId) {
        // Delegate to the user service to retrieve all parent profiles associated with the specified school
        return userService.getParentsBySchool(schoolId);
    }

    @Operation(summary = "List all headmasters", description = "Returns id + full name for every user with the HEADMASTER role. ADMIN only.")
    @ApiResponse(responseCode = "200", description = "Headmaster list returned")
    @GetMapping("/headmasters")
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserSummaryDto> getHeadmasters() {
        // Retrieve a summary list of all users identified as headmasters
        return userService.getHeadmasters();
    }

    @Operation(summary = "Get user profile picture", description = "Returns the raw image bytes with the correct Content-Type. Returns 404 if no picture is set.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Image returned"),
        @ApiResponse(responseCode = "404", description = "User not found or no picture set")
    })
    @GetMapping("/{id}/picture")
    public ResponseEntity<byte[]> getPicture(
            @Parameter(description = "User ID") @PathVariable Long id) {
        // Delegate to the user service to retrieve the image bytes and appropriate media type
        return userService.getPicture(id);
    }

    @Operation(summary = "Create a user", description = "Creates a new user account with a hashed password. ADMIN only.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "User created"),
        @ApiResponse(responseCode = "409", description = "Email already in use")
    })
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> create(@Valid @RequestBody CreateUserRequest req) {
        // Validate the user creation request and persist the new user via the service layer
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.createUser(req));
    }

    @Operation(summary = "Update a user", description = "Updates name, email, role, and optionally password. ADMIN only.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "User updated"),
        @ApiResponse(responseCode = "404", description = "User not found")
    })
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> update(
            @Parameter(description = "User ID") @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest req) {
        // Delegate the update logic to the service layer and return the updated user DTO
        return ResponseEntity.ok(userService.updateUser(id, req));
    }

    @Operation(summary = "Delete a user", description = "Permanently deletes a user account. ADMIN only.")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "User deleted"),
        @ApiResponse(responseCode = "404", description = "User not found")
    })
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(
            @Parameter(description = "User ID") @PathVariable Long id) {
        // Delegate user removal to the service layer
        userService.deleteUser(id);
        // Return 204 No Content on successful deletion
        return ResponseEntity.noContent().build();
    }
}
