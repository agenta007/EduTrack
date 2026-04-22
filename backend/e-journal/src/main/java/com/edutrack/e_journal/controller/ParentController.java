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
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/parents")
@RequiredArgsConstructor
@Tag(name = "Parents", description = "Headmaster operations — link/unlink parents to students and edit parent data")
@SecurityRequirement(name = "bearerAuth")
public class ParentController {

    private final ParentService parentService;

    @Operation(summary = "List parents at a school",
               description = "Returns parents with their children (filtered to the given school). HEADMASTER (own school) or ADMIN.")
    @ApiResponse(responseCode = "200", description = "Parent list returned")
    @GetMapping("/school/{schoolId}")
    @PreAuthorize("hasAnyRole('ADMIN','HEADMASTER')")
    public List<ParentDto> getBySchool(
            @Parameter(description = "School ID") @PathVariable Long schoolId,
            @AuthenticationPrincipal UserDetails principal) {
        // Delegate to service to fetch parents and validate the headmaster's authority over the school
        return parentService.getBySchool(schoolId, principal);
    }

    @Operation(summary = "List all parent-role users",
               description = "Returns every user with the PARENT role for the link-parent dialog. HEADMASTER only.")
    @ApiResponse(responseCode = "200", description = "Parent user list returned")
    @GetMapping("/available")
    @PreAuthorize("hasRole('HEADMASTER')")
    public List<UserDto> getAvailable() {
        // Retrieve all users with the PARENT role for the school's headmaster
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
        // Delegate the linking logic to the service layer and return the updated parent DTO
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
        // Delegate the unlinking logic to the service layer, passing the authenticated principal for authority checks
        parentService.unlink(parentId, studentId, principal);
        // Return 204 No Content to indicate a successful deletion/update with no response body
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
        // Delegate the update logic to the service layer using the provided DTO and security principal
        return ResponseEntity.ok(parentService.update(
                parentId, req.getFirstName(), req.getLastName(), req.getEmail(), principal));
    }

    // ── Inline request DTO ────────────────────────────────────────────────────

    @Getter @NoArgsConstructor
    public static class UpdateParentRequest {
        private String firstName;
        private String lastName;
        private String email;
    }
}
