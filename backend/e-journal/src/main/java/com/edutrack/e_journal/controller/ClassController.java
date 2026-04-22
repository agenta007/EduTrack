package com.edutrack.e_journal.controller;

import com.edutrack.e_journal.dto.SchoolClassDto;
import com.edutrack.e_journal.dto.UserSummaryDto;
import com.edutrack.e_journal.service.ClassService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/classes")
@RequiredArgsConstructor
@Tag(name = "Classes", description = "Query school classes and their students")
@SecurityRequirement(name = "bearerAuth")
public class ClassController {

    private final ClassService classService;

    @Operation(summary = "List all classes", description = "Returns every class across all schools. Accessible by ADMIN, HEADMASTER, and TEACHER.")
    @ApiResponse(responseCode = "200", description = "Class list returned")
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','HEADMASTER','TEACHER')")
    public List<SchoolClassDto> getAll(@AuthenticationPrincipal UserDetails principal) {
        // Delegate to the service layer to retrieve classes filtered by the user's authority
        return classService.getAll(principal);
    }

    @Operation(summary = "List classes at a school", description = "Returns all classes belonging to the given school. Accessible by ADMIN and HEADMASTER.")
    @ApiResponse(responseCode = "200", description = "Class list returned")
    @GetMapping("/school/{schoolId}")
    @PreAuthorize("hasAnyRole('ADMIN','HEADMASTER')")
    public List<SchoolClassDto> getBySchool(
            @Parameter(description = "School ID") @PathVariable Long schoolId) {
        // Fetch all school classes associated with the specified school ID
        return classService.getBySchool(schoolId);
    }

    @Operation(summary = "Get a class by ID")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Class found"),
        @ApiResponse(responseCode = "404", description = "Class not found")
    })
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HEADMASTER','TEACHER','PARENT','STUDENT')")
    public SchoolClassDto getById(
            @Parameter(description = "Class ID") @PathVariable Long id) {
        // Retrieve the school class details from the service layer
        return classService.getById(id);
    }

    @Operation(summary = "List students in a class", description = "Returns id and full name for every student enrolled in the class.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Student list returned"),
        @ApiResponse(responseCode = "404", description = "Class not found")
    })
    @GetMapping("/{id}/students")
    @PreAuthorize("hasAnyRole('ADMIN','HEADMASTER','TEACHER')")
    public List<UserSummaryDto> getStudents(
            @Parameter(description = "Class ID") @PathVariable Long id) {
        // Retrieve the list of student summaries for the specified school class
        return classService.getStudents(id);
    }
}
