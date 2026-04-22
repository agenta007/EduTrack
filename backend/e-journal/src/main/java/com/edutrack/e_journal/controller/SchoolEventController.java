package com.edutrack.e_journal.controller;

import com.edutrack.e_journal.dto.SchoolEventDto;
import com.edutrack.e_journal.dto.SchoolEventRequest;
import com.edutrack.e_journal.service.SchoolEventService;
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
@RequestMapping("/api/events")
@RequiredArgsConstructor
@Tag(name = "Events", description = "School calendar events: tests, holidays, meetings")
@SecurityRequirement(name = "bearerAuth")
public class SchoolEventController {

    private final SchoolEventService eventService;

    @Operation(summary = "Get my calendar events",
               description = "Returns all events visible to the authenticated student: " +
                             "system-wide, school-wide, and class-specific.")
    @ApiResponse(responseCode = "200", description = "Event list returned")
    @GetMapping("/student/me")
    @PreAuthorize("hasAnyRole('STUDENT','PARENT')")
    public List<SchoolEventDto> getMyEvents(@AuthenticationPrincipal UserDetails principal) {
        return eventService.getForCurrentStudent(principal);
    }

    @Operation(summary = "Get events for a class")
    @ApiResponse(responseCode = "200", description = "Event list returned")
    @GetMapping("/class/{classId}")
    @PreAuthorize("hasAnyRole('ADMIN','HEADMASTER','TEACHER')")
    public List<SchoolEventDto> getByClass(
            @Parameter(description = "Class ID") @PathVariable Long classId) {
        return eventService.getByClass(classId);
    }

    @Operation(summary = "Get events for a school")
    @ApiResponse(responseCode = "200", description = "Event list returned")
    @GetMapping("/school/{schoolId}")
    @PreAuthorize("hasAnyRole('ADMIN','HEADMASTER')")
    public List<SchoolEventDto> getBySchool(
            @Parameter(description = "School ID") @PathVariable Long schoolId) {
        return eventService.getBySchool(schoolId);
    }

    @Operation(summary = "Create a calendar event",
               description = "Creates a new event. Leave schoolId/classId null for broader scope.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Event created"),
        @ApiResponse(responseCode = "400", description = "Invalid type, school, or class ID")
    })
    @PostMapping
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN','HEADMASTER')")
    public ResponseEntity<SchoolEventDto> create(
            @Valid @RequestBody SchoolEventRequest req,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(eventService.create(req, principal));
    }

    @Operation(summary = "Delete a calendar event")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Event deleted"),
        @ApiResponse(responseCode = "404", description = "Event not found")
    })
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN','HEADMASTER')")
    public ResponseEntity<Void> delete(
            @Parameter(description = "Event ID") @PathVariable Long id) {
        eventService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
