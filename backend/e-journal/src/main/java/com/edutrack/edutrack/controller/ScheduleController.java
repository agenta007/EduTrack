package com.edutrack.e_journal.controller;

import com.edutrack.e_journal.dto.ScheduleDto;
import com.edutrack.e_journal.dto.ScheduleRequest;
import com.edutrack.e_journal.entity.LectureType;
import com.edutrack.e_journal.service.ScheduleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
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
@RequestMapping("/api/schedules")
@RequiredArgsConstructor
@Tag(name = "Schedules", description = "Curriculum schedules — which teacher teaches which subject to which class")
@SecurityRequirement(name = "bearerAuth")
public class ScheduleController {

    private final ScheduleService scheduleService;

    @Operation(summary = "List schedules for a class", description = "Returns all curriculum entries for the given class. Accessible by all authenticated roles.")
    @ApiResponse(responseCode = "200", description = "Schedule list returned")
    @GetMapping("/class/{classId}")
    @PreAuthorize("hasAnyRole('ADMIN','HEADMASTER','TEACHER','PARENT','STUDENT')")
    public List<ScheduleDto> getByClass(
            @Parameter(description = "Class ID") @PathVariable Long classId) {
        // Retrieve the curriculum schedule entries associated with the specified school class
        return scheduleService.getByClass(classId);
    }

    @Operation(summary = "Get schedules for a teacher", description = "Returns all curriculum entries for the given teacher. Accessible by ADMIN and HEADMASTER.")
    @ApiResponse(responseCode = "200", description = "Teacher schedule returned")
    @GetMapping("/teacher/{teacherId}")
    @PreAuthorize("hasAnyRole('ADMIN','HEADMASTER')")
    public List<ScheduleDto> getByTeacher(
            @Parameter(description = "Teacher user ID") @PathVariable Long teacherId) {
        // Retrieve all schedule entries associated with the specified teacher
        return scheduleService.getByTeacher(teacherId);
    }

    @Operation(summary = "Get my schedule", description = "Returns the full curriculum schedule for the currently authenticated teacher.")
    @ApiResponse(responseCode = "200", description = "Teacher's schedule returned")
    @GetMapping("/teacher/me")
    @PreAuthorize("hasRole('TEACHER')")
    public List<ScheduleDto> getMySchedule(@AuthenticationPrincipal UserDetails principal) {
        // Retrieve the schedule entries associated with the authenticated teacher's identity
        return scheduleService.getMySchedule(principal);
    }

    @Operation(summary = "Create a schedule entry", description = "Assigns a teacher to teach a subject to a class for a given term. Accessible by ADMIN and HEADMASTER.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Schedule entry created"),
        @ApiResponse(responseCode = "400", description = "Invalid class, subject, or teacher ID")
    })
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','HEADMASTER')")
    public ResponseEntity<ScheduleDto> create(@Valid @RequestBody ScheduleRequest req) {
        // Persist the new schedule entry and return the created DTO
        return ResponseEntity.status(HttpStatus.CREATED).body(scheduleService.create(req));
    }

    @Operation(summary = "Update lecture type and attendance tracking",
               description = "Changes the lecture type (STANDARD / SIP / EXTRACURRICULAR) and whether absences are tracked. ADMIN and HEADMASTER only.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Entry updated"),
        @ApiResponse(responseCode = "404", description = "Entry not found")
    })
    @PatchMapping("/{id}/type")
    @PreAuthorize("hasAnyRole('ADMIN','HEADMASTER')")
    public ResponseEntity<ScheduleDto> patchType(
            @Parameter(description = "Schedule entry ID") @PathVariable Long id,
            @RequestBody TypePatchRequest req) {
        // Delegate the partial update to the service layer and return the updated schedule DTO
        return ResponseEntity.ok(scheduleService.patchType(id, req.getLectureType(), req.getTrackAttendance()));
    }

    @Operation(summary = "Delete a schedule entry", description = "Removes a curriculum entry. Accessible by ADMIN and HEADMASTER.")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Schedule entry deleted"),
        @ApiResponse(responseCode = "404", description = "Schedule entry not found")
    })
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HEADMASTER')")
    public ResponseEntity<Void> delete(
            @Parameter(description = "Schedule entry ID") @PathVariable Long id) {
        // Remove the schedule entry from the database via the service layer
        scheduleService.delete(id);
        // Return 204 No Content to indicate successful deletion
        return ResponseEntity.noContent().build();
    }

    // ── Inline request DTO ────────────────────────────────────────────────────

    @Getter @NoArgsConstructor
    public static class TypePatchRequest {
        private LectureType lectureType;
        private Boolean trackAttendance;
    }
}
