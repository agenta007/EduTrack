package com.edutrack.e_journal.controller;

import com.edutrack.e_journal.dto.ComplaintDto;
import com.edutrack.e_journal.dto.ComplaintRequest;
import com.edutrack.e_journal.service.ComplaintService;
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
@RequestMapping("/api/complaints")
@RequiredArgsConstructor
@Tag(name = "Complaints", description = "Record and query disciplinary complaints against students")
@SecurityRequirement(name = "bearerAuth")
public class ComplaintController {

    private final ComplaintService complaintService;

    @Operation(summary = "List complaints for a class", description = "Returns all complaints for every student in the given class. Accessible by ADMIN, HEADMASTER, and TEACHER.")
    @ApiResponse(responseCode = "200", description = "Complaint list returned")
    @GetMapping("/class/{classId}")
    @PreAuthorize("hasAnyRole('ADMIN','HEADMASTER','TEACHER')")
    public List<ComplaintDto> getByClass(
            @Parameter(description = "Class ID") @PathVariable Long classId) {
        // Retrieve all complaints associated with the specified school class
        return complaintService.getByClass(classId);
    }

    @Operation(summary = "Get my complaints", description = "Returns complaints issued against the authenticated student.")
    @ApiResponse(responseCode = "200", description = "Complaint list returned")
    @GetMapping("/student/me")
    @PreAuthorize("hasRole('STUDENT')")
    public List<ComplaintDto> getMyComplaints(@AuthenticationPrincipal UserDetails principal) {
        // Retrieve all complaints associated with the authenticated student profile
        return complaintService.getByCurrentStudent(principal);
    }

    @Operation(summary = "List complaints for a student", description = "Returns all complaints for a specific student. Accessible by PARENT, ADMIN, HEADMASTER, and TEACHER.")
    @ApiResponse(responseCode = "200", description = "Complaint list returned")
    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAnyRole('PARENT','ADMIN','HEADMASTER','TEACHER')")
    public List<ComplaintDto> getByStudent(
            @Parameter(description = "Student user ID") @PathVariable Long studentId) {
        // Retrieve the list of complaint DTOs associated with the specified student
        return complaintService.getByStudent(studentId);
    }

    @Operation(summary = "File a complaint", description = "Creates a new disciplinary complaint against a student. Accessible by TEACHER, ADMIN, and HEADMASTER.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Complaint recorded"),
        @ApiResponse(responseCode = "400", description = "Invalid student or schedule ID")
    })
    @PostMapping
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN','HEADMASTER')")
    public ResponseEntity<ComplaintDto> create(@Valid @RequestBody ComplaintRequest req) {
        // Validate the complaint request DTO and delegate the creation logic to the service layer
        return ResponseEntity.status(HttpStatus.CREATED).body(complaintService.create(req));
    }

    @Operation(summary = "Delete a complaint", description = "Permanently removes a complaint record. Accessible by TEACHER, ADMIN, and HEADMASTER.")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Complaint deleted"),
        @ApiResponse(responseCode = "404", description = "Complaint not found")
    })
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN','HEADMASTER')")
    public ResponseEntity<Void> delete(
            @Parameter(description = "Complaint ID") @PathVariable Long id) {
        complaintService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
