package com.edutrack.e_journal.controller;

import com.edutrack.e_journal.dto.SubjectDto;
import com.edutrack.e_journal.dto.SubjectRequest;
import com.edutrack.e_journal.service.SubjectService;
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
@RequestMapping("/api/subjects")
@RequiredArgsConstructor
@Tag(name = "Subjects", description = "Manage school subjects (admin only for write operations)")
@SecurityRequirement(name = "bearerAuth")
public class SubjectController {

    private final SubjectService subjectService;

    @Operation(summary = "List all subjects", description = "Returns every subject. Accessible by ADMIN and HEADMASTER.")
    @ApiResponse(responseCode = "200", description = "Subject list returned")
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','HEADMASTER')")
    public List<SubjectDto> getAll() {
        // Fetch all subject records from the service layer
        return subjectService.getAll();
    }

    @Operation(summary = "Create a subject", description = "Creates a new subject. ADMIN only.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Subject created"),
        @ApiResponse(responseCode = "400", description = "Validation error")
    })
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SubjectDto> create(@Valid @RequestBody SubjectRequest req) {
        // Validate the subject request DTO and delegate creation to the subject service
        return ResponseEntity.status(HttpStatus.CREATED).body(subjectService.create(req));
    }

    @Operation(summary = "Update a subject", description = "Renames an existing subject. ADMIN only.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Subject updated"),
        @ApiResponse(responseCode = "404", description = "Subject not found")
    })
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SubjectDto> update(
            @Parameter(description = "Subject ID") @PathVariable Long id,
            @Valid @RequestBody SubjectRequest req) {
        // Delegate the subject update logic to the service layer and return the updated DTO
        return ResponseEntity.ok(subjectService.update(id, req));
    }

    @Operation(summary = "Delete a subject", description = "Permanently deletes a subject. ADMIN only.")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Subject deleted"),
        @ApiResponse(responseCode = "404", description = "Subject not found")
    })
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(
            @Parameter(description = "Subject ID") @PathVariable Long id) {
        // Delegate subject removal to the service layer
        subjectService.delete(id);
        // Return 204 No Content on successful deletion
        return ResponseEntity.noContent().build();
    }
}
