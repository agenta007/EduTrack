package com.edutrack.e_journal.controller;

import com.edutrack.e_journal.dto.ParentDto;
import com.edutrack.e_journal.dto.UserDto;
import com.edutrack.e_journal.service.ParentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/parents")
@RequiredArgsConstructor
@Tag(name = "Parents", description = "Parent management operations — create, link/unlink parents to students and edit parent data")
@SecurityRequirement(name = "bearerAuth")
public class ParentController {
    private final ParentService parentService;

    // ── MISSING ENDPOINT ADDED HERE ───────────────────────────────────────────
    @Operation(summary = "Create a new parent",
            description = "Creates a new user with the PARENT role. HEADMASTER only.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Parent created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request data"),
            @ApiResponse(responseCode = "403", description = "Not authorized for this school")
    })
    @PostMapping
    @PreAuthorize("hasRole('HEADMASTER')")
    public ResponseEntity<ParentDto> create(
            @RequestBody CreateParentRequest req,
            @AuthenticationPrincipal UserDetails principal) {
        ParentDto newParent = parentService.create(
                req.getFirstName(),
                req.getLastName(),
                req.getEmail(),
                req.getSchoolId(),
                principal
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(newParent);
    }
    // ──────────────────────────────────────────────────────────────────────────

    @Operation(summary = "List parents at a school",
            description = "Returns parents with their children (filtered to the given school). HEADMASTER (own school) or ADMIN.")
    @ApiResponse(responseCode = "200", description = "Parent list returned")
    @GetMapping("/school/{schoolId}")
    @PreAuthorize("hasAnyRole('ADMIN','HEADMASTER')")
    public List<ParentDto> getBySchool(
            @Parameter(description = "School ID") @PathVariable Long schoolId,
            @AuthenticationPrincipal UserDetails principal) {
        return parentService.getBySchool(schoolId, principal);
    }

    @Operation(summary = "List all parent-role users",
            description = "Returns every user with the PARENT role for the link-parent dialog. HEADMASTER only.")
    @ApiResponse(responseCode = "200", description = "Parent user list returned")
    @GetMapping("/available")
    @PreAuthorize("hasRole('HEADMASTER')")
    public List<UserDto> getAvailable() {
        return parentService.getAvailable();
    }

    @Operation(summary = "Link a parent to a student",
            description = "Sets the student's parent to the given user. The student must belong to the headmaster's school. HEADMASTER only.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Linked — updated ParentDto returned"),
            @ApiResponse(responseCode = "400", description = "User is not a parent"),
            @ApiResponse(responseCode = "403", description = "Student does not belong to headmaster's school"),
            @ApiResponse(responseCode = "404", description = "Parent or student not found")
    })
    @PostMapping("/{parentId}/link/{studentId}")
    @PreAuthorize("hasRole('HEADMASTER')")
    public ResponseEntity<ParentDto> link(
            @Parameter(description = "Parent user ID") @PathVariable Long parentId,
            @Parameter(description = "Student user ID") @PathVariable Long studentId,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(parentService.link(parentId, studentId, principal));
    }

    @Operation(summary = "Unlink a parent from a student",
            description = "Clears the student's parent field. The student must belong to the headmaster's school. HEADMASTER only.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Unlinked successfully"),
            @ApiResponse(responseCode = "403", description = "Student does not belong to headmaster's school"),
            @ApiResponse(responseCode = "404", description = "Parent or student not found")
    })
    @DeleteMapping("/{parentId}/unlink/{studentId}")
    @PreAuthorize("hasRole('HEADMASTER')")
    public ResponseEntity<Void> unlink(
            @Parameter(description = "Parent user ID") @PathVariable Long parentId,
            @Parameter(description = "Student user ID") @PathVariable Long studentId,
            @AuthenticationPrincipal UserDetails principal) {
        parentService.unlink(parentId, studentId, principal);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Update parent data",
            description = "Updates a parent's first name, last name, and email. HEADMASTER only.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Parent updated — updated ParentDto returned"),
            @ApiResponse(responseCode = "404", description = "Parent not found")
    })
    @PutMapping("/{parentId}")
    @PreAuthorize("hasRole('HEADMASTER')")
    public ResponseEntity<ParentDto> update(
            @Parameter(description = "Parent user ID") @PathVariable Long parentId,
            @RequestBody UpdateParentRequest req,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(parentService.update(
                parentId, req.getFirstName(), req.getLastName(), req.getEmail(), principal));
    }

    // ── MISSING DTO ADDED HERE ────────────────────────────────────────────────
    @Getter @NoArgsConstructor
    public static class CreateParentRequest {
        private String firstName;
        private String lastName;
        private String email;
        private Long schoolId;
    }
    // ──────────────────────────────────────────────────────────────────────────

    @Getter @NoArgsConstructor
    public static class UpdateParentRequest {
        private String firstName;
        private String lastName;
        private String email;
    }
}