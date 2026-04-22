package com.edutrack.e_journal.controller;

import com.edutrack.e_journal.dto.AbsenceDto;
import com.edutrack.e_journal.dto.AbsenceRequest;
import com.edutrack.e_journal.service.AbsenceService;
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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/absences")
@RequiredArgsConstructor
@Tag(name = "Absences", description = "Record and query student absences")
@SecurityRequirement(name = "bearerAuth")
public class AbsenceController {

    private final AbsenceService absenceService;

    @Operation(summary = "List absences for a class", description = "Returns all absences for every student in the given class. Accessible by ADMIN, HEADMASTER, and TEACHER.")
    @ApiResponse(responseCode = "200", description = "Absence list returned")
    @GetMapping("/class/{classId}")
    @PreAuthorize("hasAnyRole('ADMIN','HEADMASTER','TEACHER')")
    public List<AbsenceDto> getByClass(
            @Parameter(description = "Class ID") @PathVariable Long classId) {
        // Retrieve the list of absence DTOs for the specified school class via the service layer
        return absenceService.getByClass(classId);
    }

    @Operation(summary = "Get my absences", description = "Returns absences for the authenticated student.")
    @ApiResponse(responseCode = "200", description = "Absence list returned")
    @GetMapping("/student/me")
    @PreAuthorize("hasRole('STUDENT')")
    public List<AbsenceDto> getMyAbsences(@AuthenticationPrincipal UserDetails principal) {
        // Retrieve the absence history for the currently authenticated student principal
        return absenceService.getByCurrentStudent(principal);
    }

    @Operation(summary = "List absences for a student", description = "Returns all absences for a specific student. Accessible by PARENT, ADMIN, HEADMASTER, and TEACHER.")
    @ApiResponse(responseCode = "200", description = "Absence list returned")
    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAnyRole('PARENT','ADMIN','HEADMASTER','TEACHER')")
    public List<AbsenceDto> getByStudent(
            @Parameter(description = "Student user ID") @PathVariable Long studentId) {
        // Delegate to the service layer to retrieve the student's absence history
        return absenceService.getByStudent(studentId);
    }

    @Operation(summary = "Record an absence", description = "Creates a new absence record. Accessible by TEACHER, ADMIN, and HEADMASTER.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Absence recorded"),
        @ApiResponse(responseCode = "400", description = "Invalid student or schedule ID")
    })
    @PostMapping
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN','HEADMASTER')")
    public ResponseEntity<AbsenceDto> create(@Valid @RequestBody AbsenceRequest req) {
        // Process the absence request and return the created absence DTO
        return ResponseEntity.status(HttpStatus.CREATED).body(absenceService.create(req));
    }

    @Operation(summary = "Toggle excuse status", description = "Flips the excused flag on an absence. Accessible by TEACHER, ADMIN, and HEADMASTER.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Absence updated"),
        @ApiResponse(responseCode = "404", description = "Absence not found")
    })
    @PutMapping("/{id}/excuse")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN','HEADMASTER')")
    public ResponseEntity<AbsenceDto> toggleExcuse(
            @Parameter(description = "Absence ID") @PathVariable Long id) {
        // Update the excused status of the specified absence and return the updated DTO
        return ResponseEntity.ok(absenceService.toggleExcuse(id));
    }

    @Operation(summary = "Delete an absence", description = "Permanently removes an absence record. Accessible by TEACHER, ADMIN, and HEADMASTER.")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Absence deleted"),
        @ApiResponse(responseCode = "404", description = "Absence not found")
    })
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN','HEADMASTER')")
    public ResponseEntity<Void> delete(
            @Parameter(description = "Absence ID") @PathVariable Long id) {
        // Delegate the removal of the absence record to the service layer
        absenceService.delete(id);
        // Return 204 No Content to indicate successful deletion without a response body
        return ResponseEntity.noContent().build();
    }
}
