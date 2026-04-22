package com.edutrack.e_journal.controller;

import com.edutrack.e_journal.dto.GradeDto;
import com.edutrack.e_journal.dto.GradeRequest;
import com.edutrack.e_journal.service.GradeService;
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
@RequestMapping("/api/grades")
@RequiredArgsConstructor
@Tag(name = "Grades", description = "Record and query student grades (Bulgarian scale 2–6)")
@SecurityRequirement(name = "bearerAuth")
public class GradeController {

    private final GradeService gradeService;

    @Operation(summary = "List grades for a class", description = "Returns all grades for every student in the given class. Accessible by ADMIN, HEADMASTER, and TEACHER.")
    @ApiResponse(responseCode = "200", description = "Grade list returned")
    @GetMapping("/class/{classId}")
    @PreAuthorize("hasAnyRole('ADMIN','HEADMASTER','TEACHER')")
    public List<GradeDto> getByClass(
            @Parameter(description = "Class ID") @PathVariable Long classId) {
        // Retrieve the list of grade DTOs for the specified school class via the service layer
        return gradeService.getByClass(classId);
    }

    @Operation(summary = "Get my grades", description = "Returns grades for the authenticated student.")
    @ApiResponse(responseCode = "200", description = "Grade list returned")
    @GetMapping("/student/me")
    @PreAuthorize("hasRole('STUDENT')")
    public List<GradeDto> getMyGrades(@AuthenticationPrincipal UserDetails principal) {
        // Retrieve the grade history for the currently authenticated student principal
        return gradeService.getByCurrentStudent(principal);
    }

    @Operation(summary = "List grades for a student", description = "Returns all grades for a specific student. Accessible by PARENT, ADMIN, HEADMASTER, and TEACHER.")
    @ApiResponse(responseCode = "200", description = "Grade list returned")
    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAnyRole('PARENT','ADMIN','HEADMASTER','TEACHER')")
    public List<GradeDto> getByStudent(
            @Parameter(description = "Student user ID") @PathVariable Long studentId) {
        // Fetch the grade history for the specified student via the service layer
        return gradeService.getByStudent(studentId);
    }

    @Operation(summary = "Add a grade", description = "Records a new grade. Value must be one of: 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6. Accessible by TEACHER, ADMIN, and HEADMASTER.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Grade recorded"),
        @ApiResponse(responseCode = "400", description = "Invalid grade value, student, or schedule ID")
    })
    @PostMapping
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN','HEADMASTER')")
    public ResponseEntity<GradeDto> create(@Valid @RequestBody GradeRequest req) {
        // Process the grade creation request and return the resulting DTO
        return ResponseEntity.status(HttpStatus.CREATED).body(gradeService.create(req));
    }

    @Operation(summary = "Delete a grade", description = "Permanently removes a grade record. Accessible by TEACHER, ADMIN, and HEADMASTER.")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Grade deleted"),
        @ApiResponse(responseCode = "404", description = "Grade not found")
    })
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN','HEADMASTER')")
    public ResponseEntity<Void> delete(
            @Parameter(description = "Grade ID") @PathVariable Long id) {
        // Remove the grade record from the database via the service layer
        gradeService.delete(id);
        // Return 204 No Content to indicate successful deletion
        return ResponseEntity.noContent().build();
    }
}
