package com.edutrack.e_journal.controller;

import com.edutrack.e_journal.dto.SchoolDto;
import com.edutrack.e_journal.dto.SchoolRequest;
import com.edutrack.e_journal.dto.SchoolScheduleEntryDto;
import com.edutrack.e_journal.dto.SchoolScheduleEntryRequest;
import com.edutrack.e_journal.dto.SchoolTermConfigDto;
import com.edutrack.e_journal.service.SchoolService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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
@RequestMapping("/api/schools")
@RequiredArgsConstructor
@Tag(name = "Schools", description = "School management — CRUD, profiles, daily schedule, term configuration, and student limit")
@SecurityRequirement(name = "bearerAuth")
public class SchoolController {

    private final SchoolService schoolService;

    // ── Schools ───────────────────────────────────────────────────────────────

    @Operation(summary = "List all schools", description = "Returns every school with its headmaster and profiles. ADMIN only.")
    @ApiResponse(responseCode = "200", description = "School list returned")
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<SchoolDto> getAll() {
        // Retrieve the full list of schools with their associated profiles and headmasters
        return schoolService.getAllSchools();
    }

    @Operation(summary = "Get a school by ID", description = "Returns a single school. Accessible by ADMIN, HEADMASTER, and TEACHER.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "School returned"),
        @ApiResponse(responseCode = "404", description = "School not found")
    })
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HEADMASTER','TEACHER')")
    public SchoolDto getById(
            @Parameter(description = "School ID") @PathVariable Long id) {
        // Retrieve the school details from the service layer using the provided ID
        return schoolService.getSchoolById(id);
    }

    @Operation(summary = "Create a school", description = "Creates a new school, optionally assigning a headmaster. ADMIN only.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "School created"),
        @ApiResponse(responseCode = "400", description = "Validation error or headmaster not found")
    })
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SchoolDto> create(@Valid @RequestBody SchoolRequest req) {
        // Delegate the school creation logic to the service layer and return the created DTO with 201 Created status
        return ResponseEntity.status(HttpStatus.CREATED).body(schoolService.createSchool(req));
    }

    @Operation(summary = "Update a school", description = "Updates name, address, type, and headmaster. ADMIN only.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "School updated"),
        @ApiResponse(responseCode = "404", description = "School not found")
    })
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SchoolDto> update(
            @Parameter(description = "School ID") @PathVariable Long id,
            @Valid @RequestBody SchoolRequest req) {
        // Delegate the school update logic to the service layer and return the updated DTO
        return ResponseEntity.ok(schoolService.updateSchool(id, req));
    }

    @Operation(summary = "Update school name and address", description = "Allows a headmaster to update their own school's name and address. ADMIN can update any school.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "School info updated"),
        @ApiResponse(responseCode = "403", description = "Not your school"),
        @ApiResponse(responseCode = "404", description = "School not found")
    })
    @PatchMapping("/{id}/info")
    @PreAuthorize("hasAnyRole('ADMIN','HEADMASTER')")
    public ResponseEntity<SchoolDto> updateInfo(
            @Parameter(description = "School ID") @PathVariable Long id,
            @Valid @RequestBody UpdateInfoRequest req,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(schoolService.updateSchoolInfo(id, req.getName(), req.getAddress(), principal));
    }

    @Getter
    @NoArgsConstructor
    static class UpdateInfoRequest {
        @NotBlank @Size(max = 150) private String name;
        private String address;
    }

    @Operation(summary = "Delete a school", description = "Permanently deletes a school. ADMIN only.")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "School deleted"),
        @ApiResponse(responseCode = "404", description = "School not found")
    })
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(
            @Parameter(description = "School ID") @PathVariable Long id) {
        // Delegate the deletion logic to the school service
        schoolService.deleteSchool(id);
        // Return 204 No Content to indicate successful deletion
        return ResponseEntity.noContent().build();
    }

    // ── Profiles ──────────────────────────────────────────────────────────────

    @Operation(summary = "List school profiles", description = "Returns the specialisation profiles defined for a school. Accessible by ADMIN, HEADMASTER, and TEACHER.")
    @ApiResponse(responseCode = "200", description = "Profile list returned")
    @GetMapping("/{schoolId}/profiles")
    @PreAuthorize("hasAnyRole('ADMIN','HEADMASTER','TEACHER')")
    public List<SchoolDto.ProfileDto> getProfiles(
            @Parameter(description = "School ID") @PathVariable Long schoolId) {
        // Retrieve the school's specialization profiles via the service layer
        return schoolService.getProfiles(schoolId);
    }

    @Operation(summary = "Add a profile to a school", description = "Adds a new specialisation profile. ADMIN only.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Profile added"),
        @ApiResponse(responseCode = "404", description = "School not found")
    })
    @PostMapping("/{schoolId}/profiles")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SchoolDto.ProfileDto> addProfile(
            @Parameter(description = "School ID") @PathVariable Long schoolId,
            @Valid @RequestBody ProfileRequest req) {
        // Create a new school profile and return the created DTO with 201 Created status
        return ResponseEntity.status(HttpStatus.CREATED).body(schoolService.addProfile(schoolId, req.getName()));
    }

    @Operation(summary = "Delete a school profile", description = "Removes a specialisation profile. ADMIN only.")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Profile deleted"),
        @ApiResponse(responseCode = "404", description = "Profile not found")
    })
    @DeleteMapping("/profiles/{profileId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteProfile(
            @Parameter(description = "Profile ID") @PathVariable Long profileId) {
        // Delegate the deletion of the school profile to the service layer
        schoolService.deleteProfile(profileId);
        // Return 204 No Content to indicate successful deletion without response body
        return ResponseEntity.noContent().build();
    }

    // ── Daily Schedule ────────────────────────────────────────────────────────

    @Operation(summary = "Get school daily schedule", description = "Returns the ordered list of LECTURE/BREAK/SPECIAL_EVENT entries. Accessible by ADMIN, HEADMASTER, and TEACHER.")
    @ApiResponse(responseCode = "200", description = "Daily schedule returned")
    @GetMapping("/{schoolId}/schedule")
    @PreAuthorize("hasAnyRole('ADMIN','HEADMASTER','TEACHER')")
    public List<SchoolScheduleEntryDto> getSchedule(
            @Parameter(description = "School ID") @PathVariable Long schoolId) {
        // Fetch the daily schedule entries for the specified school
        return schoolService.getSchedule(schoolId);
    }

    @Operation(summary = "Add a daily schedule entry", description = "Appends a new entry to the school's daily schedule. Accessible by ADMIN and the school's own HEADMASTER.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Entry added"),
        @ApiResponse(responseCode = "403", description = "Headmaster does not own this school"),
        @ApiResponse(responseCode = "404", description = "School not found")
    })
    @PostMapping("/{schoolId}/schedule")
    @PreAuthorize("hasAnyRole('ADMIN','HEADMASTER')")
    public ResponseEntity<SchoolScheduleEntryDto> addScheduleEntry(
            @Parameter(description = "School ID") @PathVariable Long schoolId,
            @Valid @RequestBody SchoolScheduleEntryRequest req,
            @AuthenticationPrincipal UserDetails principal) {
        // Delegate to the service layer to create the new schedule entry and verify school ownership
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(schoolService.addScheduleEntry(schoolId, req, principal));
    }

    @Operation(summary = "Update a daily schedule entry", description = "Edits an existing school day entry. Accessible by ADMIN and the school's own HEADMASTER.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Entry updated"),
        @ApiResponse(responseCode = "403", description = "Headmaster does not own this school"),
        @ApiResponse(responseCode = "404", description = "Entry not found")
    })
    @PutMapping("/schedule/{entryId}")
    @PreAuthorize("hasAnyRole('ADMIN','HEADMASTER')")
    public ResponseEntity<SchoolScheduleEntryDto> updateScheduleEntry(
            @Parameter(description = "Schedule entry ID") @PathVariable Long entryId,
            @Valid @RequestBody SchoolScheduleEntryRequest req,
            @AuthenticationPrincipal UserDetails principal) {
        // Delegate the schedule update logic to the school service, passing the entry ID, request DTO, and the authenticated principal for authority checks
        return ResponseEntity.ok(schoolService.updateScheduleEntry(entryId, req, principal));
    }

    @Operation(summary = "Delete a daily schedule entry", description = "Removes an entry from the school day schedule. Accessible by ADMIN and the school's own HEADMASTER.")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Entry deleted"),
        @ApiResponse(responseCode = "403", description = "Headmaster does not own this school"),
        @ApiResponse(responseCode = "404", description = "Entry not found")
    })
    @DeleteMapping("/schedule/{entryId}")
    @PreAuthorize("hasAnyRole('ADMIN','HEADMASTER')")
    public ResponseEntity<Void> deleteScheduleEntry(
            @Parameter(description = "Schedule entry ID") @PathVariable Long entryId,
            @AuthenticationPrincipal UserDetails principal) {
        // Delegate the deletion logic and authority check to the service layer
        schoolService.deleteScheduleEntry(entryId, principal);
        // Return 204 No Content to indicate successful deletion
        return ResponseEntity.noContent().build();
    }

    // ── Term Config ───────────────────────────────────────────────────────────

    @Operation(summary = "Get term configuration", description = "Returns the school-year term dates (MM-dd format). Falls back to system defaults if not yet configured. Accessible by ADMIN, HEADMASTER, and TEACHER.")
    @ApiResponse(responseCode = "200", description = "Term config returned")
    @GetMapping("/{schoolId}/term-config")
    @PreAuthorize("hasAnyRole('ADMIN','HEADMASTER','TEACHER')")
    public SchoolTermConfigDto getTermConfig(
            @Parameter(description = "School ID") @PathVariable Long schoolId) {
        // Retrieve the term configuration for the specified school
        return schoolService.getTermConfig(schoolId);
    }

    @Operation(summary = "Update term configuration", description = "Saves custom term dates for a school. All dates use MM-dd format (e.g. '09-15'). Accessible by ADMIN and the school's own HEADMASTER.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Term config saved"),
        @ApiResponse(responseCode = "403", description = "Headmaster does not own this school"),
        @ApiResponse(responseCode = "404", description = "School not found")
    })
    @PutMapping("/{schoolId}/term-config")
    @PreAuthorize("hasAnyRole('ADMIN','HEADMASTER')")
    public ResponseEntity<SchoolTermConfigDto> updateTermConfig(
            @Parameter(description = "School ID") @PathVariable Long schoolId,
            @RequestBody SchoolTermConfigDto req,
            @AuthenticationPrincipal UserDetails principal) {
        // Delegate the term configuration update to the school service and return the updated DTO
        return ResponseEntity.ok(schoolService.updateTermConfig(schoolId, req, principal));
    }

    // ── Student Limit ─────────────────────────────────────────────────────────

    @Operation(summary = "Set student enrolment limit", description = "Sets the maximum number of students allowed in this school. Send `{ \"studentLimit\": null }` to remove the limit. Accessible by ADMIN and the school's own HEADMASTER.")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Limit saved"),
        @ApiResponse(responseCode = "403", description = "Headmaster does not own this school"),
        @ApiResponse(responseCode = "404", description = "School not found")
    })
    @PutMapping("/{schoolId}/student-limit")
    @PreAuthorize("hasAnyRole('ADMIN','HEADMASTER')")
    public ResponseEntity<Void> updateStudentLimit(
            @Parameter(description = "School ID") @PathVariable Long schoolId,
            @RequestBody StudentLimitRequest req,
            @AuthenticationPrincipal UserDetails principal) {
        schoolService.updateStudentLimit(schoolId, req.getStudentLimit(), principal);
        return ResponseEntity.noContent().build();
    }

    // ── Inline request DTOs ───────────────────────────────────────────────────

    @Getter
    @NoArgsConstructor
    public static class ProfileRequest {
        @NotBlank @Size(max = 100)
        private String name;
    }

    @Getter
    @NoArgsConstructor
    public static class StudentLimitRequest {
        private Integer studentLimit;
    }
}
