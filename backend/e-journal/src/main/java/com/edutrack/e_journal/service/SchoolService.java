package com.edutrack.e_journal.service;

import com.edutrack.e_journal.dto.SchoolDto;
import com.edutrack.e_journal.dto.SchoolRequest;
import com.edutrack.e_journal.dto.SchoolScheduleEntryDto;
import com.edutrack.e_journal.dto.SchoolScheduleEntryRequest;
import com.edutrack.e_journal.dto.SchoolTermConfigDto;
import com.edutrack.e_journal.entity.*;
import com.edutrack.e_journal.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SchoolService {

    private static final SchoolTermConfigDto DEFAULT_TERM_CONFIG =
            new SchoolTermConfigDto("09-15", "02-01", "06-01", "06-15", "07-01");

    private final SchoolRepository              schoolRepository;
    private final UserRepository                userRepository;
    private final SchoolProfileRepository       profileRepository;
    private final SchoolScheduleEntryRepository scheduleEntryRepository;
    private final SchoolTermConfigRepository    termConfigRepository;

    // ── Schools ───────────────────────────────────────────────────────────────

    // Retrieve all schools from the database and map them to their respective DTOs
    public List<SchoolDto> getAllSchools() {
        // Fetch all managed School entities and transform the stream into a list of DTOs
        return schoolRepository.findAll().stream().map(this::toDto).toList();
    }

    public SchoolDto getSchoolById(Long id) {
        // Retrieve the school by its primary key and map to DTO or handle missing entity
        return schoolRepository.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "School not found"));
    }

    public SchoolDto createSchool(SchoolRequest req) {
        // Initialize a new School entity from the request DTO
        School school = School.builder()
                .name(req.getName())
                .address(req.getAddress())
                // Map the raw type string to the SchoolType enum
                .type(resolveType(req.getType()))
                // Load the managed User entity to serve as the school's headmaster
                .director(resolveHeadmasterById(req.getHeadmasterId()))
                .build();
        // Persist the new school to the database and map the result back to a DTO
        return toDto(schoolRepository.save(school));
    }

    public SchoolDto updateSchool(Long id, SchoolRequest req) {
        // Update the existing school entity with new request data
        // Load the managed School entity or throw 404 if not found
        School school = schoolRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "School not found"));
    
        // Map the updated fields from the DTO to the entity
        school.setName(req.getName());
        school.setAddress(req.getAddress());
    
        // Resolve the school type and headmaster from their respective identifiers
        school.setType(resolveType(req.getType()));
        school.setDirector(resolveHeadmasterById(req.getHeadmasterId()));
    
        // Persist changes and return the updated school DTO
        return toDto(schoolRepository.save(school));
    }

    public SchoolDto updateSchoolInfo(Long schoolId, String name, String address,
                                      UserDetails principal) {
        // Verify the authenticated headmaster has authority over the target school
        checkHeadmasterSchoolAccess(principal, schoolId);
        // Load the managed School entity or return 404 if the ID is invalid
        School school = schoolRepository.findById(schoolId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "School not found"));
        // Apply the updated profile information to the entity
        school.setName(name);
        school.setAddress(address);
        // Persist changes to the database and map the updated entity to a DTO
        return toDto(schoolRepository.save(school));
    }

    public void deleteSchool(Long id) {
        // Verify the school exists before attempting deletion
        if (!schoolRepository.existsById(id))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "School not found");
        // Remove the school entity from the database
        schoolRepository.deleteById(id);
    }

    // ── Profiles ──────────────────────────────────────────────────────────────

    public List<SchoolDto.ProfileDto> getProfiles(Long schoolId) {
        // Retrieve all school profiles associated with the given school ID and map them to DTOs
        return profileRepository.findAllBySchool_Id(schoolId).stream()
                // Transform each managed Profile entity into a lightweight ProfileDto
                .map(p -> new SchoolDto.ProfileDto(p.getId(), p.getName()))
                .toList();
    }

    public SchoolDto.ProfileDto addProfile(Long schoolId, String name) {
        // Create a new school profile and associate it with an existing school
        // Load the managed School entity or throw 404 if the ID is invalid
        School school = schoolRepository.findById(schoolId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "School not found"));
        // Map the profile name and establish the many-to-one relationship with the school
        SchoolProfile profile = SchoolProfile.builder().name(name).school(school).build();
        // Persist the new profile to the database
        SchoolProfile saved = profileRepository.save(profile);
        // Return a flattened DTO for the API response
        return new SchoolDto.ProfileDto(saved.getId(), saved.getName());
    }

    public void deleteProfile(Long profileId) {
        // Remove a profile from the database by its ID
        // Check if the profile exists before attempting deletion
        if (!profileRepository.existsById(profileId))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found");
        // Perform the deletion of the managed profile entity
        profileRepository.deleteById(profileId);
    }

    // ── Daily Schedule ────────────────────────────────────────────────────────

    public List<SchoolScheduleEntryDto> getSchedule(Long schoolId) {
        // Retrieve the school's daily schedule entries ordered by their display sequence
        return scheduleEntryRepository.findAllBySchool_IdOrderBySortOrder(schoolId).stream()
                // Map each managed ScheduleEntry entity to its corresponding DTO
                .map(this::toScheduleDto).toList();
    }

    public SchoolScheduleEntryDto addScheduleEntry(Long schoolId, SchoolScheduleEntryRequest req,
                                                   UserDetails principal) {
        // Verify the authenticated headmaster has authority over the target school
        checkHeadmasterSchoolAccess(principal, schoolId);
        // Load the managed School entity or abort if the ID is invalid
        School school = schoolRepository.findById(schoolId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "School not found"));
        // Calculate the next available sort order based on existing entries for this school
        int nextOrder = scheduleEntryRepository.findAllBySchool_IdOrderBySortOrder(schoolId).size();
        // Map the request DTO to a new Schedule entry entity using the builder pattern
        SchoolScheduleEntry entry = SchoolScheduleEntry.builder()
                .school(school)
                .type(resolveEntryType(req.getType()))
                .label(req.getLabel())
                .startTime(LocalTime.parse(req.getStartTime()))
                .endTime(LocalTime.parse(req.getEndTime()))
                .eventDate(parseDate(req.getEventDate()))
                .sortOrder(req.getSortOrder() != null ? req.getSortOrder() : nextOrder)
                .build();
        // Persist the new entry and return the transformed DTO
        return toScheduleDto(scheduleEntryRepository.save(entry));
    }

    public SchoolScheduleEntryDto updateScheduleEntry(Long entryId, SchoolScheduleEntryRequest req,
                                                       UserDetails principal) {
        // Update an existing schedule entry with new details after verifying authority
        // Load the managed schedule entry or return 404
        SchoolScheduleEntry entry = scheduleEntryRepository.findById(entryId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Schedule entry not found"));
        // Check the headmaster's authority on this specific school
        checkHeadmasterSchoolAccess(principal, entry.getSchool().getId());
        // Map the request DTO values to the entity
        entry.setType(resolveEntryType(req.getType()));
        entry.setLabel(req.getLabel());
        entry.setStartTime(LocalTime.parse(req.getStartTime()));
        entry.setEndTime(LocalTime.parse(req.getEndTime()));
        entry.setEventDate(parseDate(req.getEventDate()));
        // Apply sort order only if provided in the request
        if (req.getSortOrder() != null) entry.setSortOrder(req.getSortOrder());
        // Persist changes and return the updated DTO
        return toScheduleDto(scheduleEntryRepository.save(entry));
    }

    public void deleteScheduleEntry(Long entryId, UserDetails principal) {
        // Remove a specific schedule entry from the database after verifying ownership
        // Load the managed schedule entry or throw 404 if the ID is invalid
        SchoolScheduleEntry entry = scheduleEntryRepository.findById(entryId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Schedule entry not found"));
        // Check the headmaster's authority on the school associated with this entry
        checkHeadmasterSchoolAccess(principal, entry.getSchool().getId());
        // Perform the deletion of the schedule record
        scheduleEntryRepository.deleteById(entryId);
    }

    // ── Term Config ───────────────────────────────────────────────────────────

    public SchoolTermConfigDto getTermConfig(Long schoolId) {
        // Retrieve the school's term configuration or fallback to system defaults
        return termConfigRepository.findById(schoolId)
                // Map the managed entity to a DTO to decouple the API response from the database model
                .map(c -> new SchoolTermConfigDto(c.getStartDate(), c.getTerm2Start(),
                        c.getElementaryEnd(), c.getProgymnasiumEnd(), c.getGymnasiumEnd()))
                // Return the default configuration if no specific config is found for the school
                .orElse(DEFAULT_TERM_CONFIG);
    }

    public SchoolTermConfigDto updateTermConfig(Long schoolId, SchoolTermConfigDto req,
                                                UserDetails principal) {
        // Verify the authenticated headmaster has authority over the target school
        checkHeadmasterSchoolAccess(principal, schoolId);
        // Load the managed School entity or abort if the ID is invalid
        School school = schoolRepository.findById(schoolId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "School not found"));
        // Retrieve existing term configuration or initialize a new one with default academic dates
        SchoolTermConfig config = termConfigRepository.findById(schoolId).orElse(
                SchoolTermConfig.builder().id(schoolId).school(school)
                        .startDate("09-15").term2Start("02-01")
                        .elementaryEnd("06-01").progymnasiumEnd("06-15").gymnasiumEnd("07-01")
                        .build());
        // Map the updated date ranges from the request DTO to the entity
        config.setStartDate(req.getStartDate());
        config.setTerm2Start(req.getTerm2Start());
        config.setElementaryEnd(req.getElementaryEnd());
        config.setProgymnasiumEnd(req.getProgymnasiumEnd());
        config.setGymnasiumEnd(req.getGymnasiumEnd());
        // Persist the changes to the database
        termConfigRepository.save(config);
        return req;
    }

    // ── Student Limit ─────────────────────────────────────────────────────────

    public void updateStudentLimit(Long schoolId, Integer limit, UserDetails principal) {
        // Verify the authenticated headmaster has authority over the target school
        checkHeadmasterSchoolAccess(principal, schoolId);
        // Load the managed School entity or abort if the ID is invalid
        School school = schoolRepository.findById(schoolId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "School not found"));
        // Update the student capacity constraint
        school.setStudentLimit(limit);
        // Persist the changes to the database
        schoolRepository.save(school);
    }

    // ── Shared helpers ─────────────────────────────────────────────────────────

    public void checkHeadmasterSchoolAccess(UserDetails principal, Long schoolId) {
        boolean isAdmin = principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!isAdmin) {
            User headmaster = userRepository.findByEmail(principal.getUsername())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
            School headmasterSchool = schoolRepository.findByDirector_Id(headmaster.getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN,
                            "No school assigned to this headmaster"));
            if (!headmasterSchool.getId().equals(schoolId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Access denied to this school's schedule");
            }
        }
    }

    public School resolveHeadmasterSchool(User headmaster) {
        // Retrieve the school entity managed by the given headmaster
        return schoolRepository.findByDirector_Id(headmaster.getId())
                // Throw a 400 error if the headmaster is not found as a director
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "No school assigned to this headmaster"));
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private User resolveHeadmasterById(Long id) {
        // Retrieve the headmaster entity by ID or throw an error if not found
        if (id == null) return null;
        return userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Headmaster user not found"));
    }

    private SchoolType resolveType(String type) {
        // Convert the raw string input into a valid SchoolType enum constant
        if (type == null || type.isBlank()) return null;
        try {
            // Normalize input to uppercase to match enum constant naming convention
            return SchoolType.valueOf(type.toUpperCase());
        } catch (IllegalArgumentException e) {
            // Return a 400 Bad Request if the provided string does not match any existing SchoolType
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid school type: " + type);
        }
    }

    private ScheduleEntryType resolveEntryType(String type) {
        // Map a raw string to the ScheduleEntryType enum, handling invalid inputs
        try {
            // Normalize input to uppercase to match enum constant naming
            return ScheduleEntryType.valueOf(type.toUpperCase());
        } catch (IllegalArgumentException e) {
            // Return a 400 Bad Request if the provided string does not match any enum constant
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid entry type: " + type);
        }
    }

    private LocalDate parseDate(String date) {
        // Safely parse an ISO-8601 date string, returning null if the input is empty or null
        return (date != null && !date.isBlank()) ? LocalDate.parse(date) : null;
    }

    private SchoolDto toDto(School s) {
        // Map the School entity to a DTO for API responses
        // Construct the headmaster's full name if the director is present
        String headmasterName = s.getDirector() != null
                ? s.getDirector().getFirstName() + " " + s.getDirector().getLastName()
                : null;
        // Convert the SchoolType enum to its string representation
        String type = s.getType() != null ? s.getType().name() : null;
        // Fetch and map all school profiles to their respective DTO shapes
        List<SchoolDto.ProfileDto> profiles = profileRepository.findAllBySchool_Id(s.getId()).stream()
                .map(p -> new SchoolDto.ProfileDto(p.getId(), p.getName()))
                .toList();
        // Assemble the final SchoolDto with all mapped properties
        return new SchoolDto(s.getId(), s.getName(), s.getAddress(), type,
                headmasterName, profiles, s.getStudentLimit());
    }

    private SchoolScheduleEntryDto toScheduleDto(SchoolScheduleEntry e) {
        // Map the schedule entry entity to its DTO representation for API responses
        return new SchoolScheduleEntryDto(
                e.getId(),
                e.getType().name(),
                e.getLabel(),
                e.getStartTime().toString(),
                e.getEndTime().toString(),
                // Handle potential null event date to avoid NullPointerException during string conversion
                e.getEventDate() != null ? e.getEventDate().toString() : null,
                e.getSortOrder()
        );
    }
}
