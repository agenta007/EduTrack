package com.edutrack.e_journal.service;

import com.edutrack.e_journal.dto.SchoolEventDto;
import com.edutrack.e_journal.dto.SchoolEventRequest;
import com.edutrack.e_journal.entity.*;
import com.edutrack.e_journal.repository.ClassRepository;
import com.edutrack.e_journal.repository.SchoolEventRepository;
import com.edutrack.e_journal.repository.SchoolRepository;
import com.edutrack.e_journal.repository.StudentRepository;
import com.edutrack.e_journal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SchoolEventService {

    private final SchoolEventRepository eventRepository;
    private final StudentRepository     studentRepository;
    private final SchoolRepository      schoolRepository;
    private final ClassRepository       schoolClassRepository;
    private final UserRepository        userRepository;

    /** All events visible to the currently authenticated student. */
    public List<SchoolEventDto> getForCurrentStudent(UserDetails principal) {
        User user = resolveUser(principal);
        Student student = studentRepository.findById(user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student profile not found"));

        if (student.getSchool() == null || student.getSchoolClass() == null) {
            // Student not yet assigned to a school/class — return only system-wide events
            return eventRepository.findAll().stream()
                    .filter(e -> e.getSchool() == null && e.getSchoolClass() == null)
                    .map(this::toDto)
                    .toList();
        }

        return eventRepository
                .findForStudent(student.getSchool().getId(), student.getSchoolClass().getId())
                .stream()
                .map(this::toDto)
                .toList();
    }

    /** All events for a specific class (used by TEACHER / HEADMASTER / ADMIN). */
    public List<SchoolEventDto> getByClass(Long classId) {
        return eventRepository.findAllBySchoolClass_IdOrderByDateAsc(classId).stream()
                .map(this::toDto).toList();
    }

    /** All events for a specific school (used by HEADMASTER / ADMIN). */
    public List<SchoolEventDto> getBySchool(Long schoolId) {
        return eventRepository.findAllBySchool_IdOrderByDateAsc(schoolId).stream()
                .map(this::toDto).toList();
    }

    public SchoolEventDto create(SchoolEventRequest req, UserDetails principal) {
        User creator = resolveUser(principal);

        EventType type;
        try {
            type = EventType.valueOf(req.getType().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid event type. Must be one of: TEST, HOLIDAY, MEETING, OTHER");
        }

        School school = null;
        if (req.getSchoolId() != null) {
            school = schoolRepository.findById(req.getSchoolId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "School not found"));
        }

        SchoolClass schoolClass = null;
        if (req.getClassId() != null) {
            schoolClass = schoolClassRepository.findById(req.getClassId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Class not found"));
        }

        SchoolEvent event = SchoolEvent.builder()
                .title(req.getTitle())
                .description(req.getDescription())
                .date(LocalDate.parse(req.getDate()))
                .type(type)
                .school(school)
                .schoolClass(schoolClass)
                .createdBy(creator)
                .build();

        return toDto(eventRepository.save(event));
    }

    public void delete(Long id) {
        if (!eventRepository.existsById(id))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found");
        eventRepository.deleteById(id);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private User resolveUser(UserDetails principal) {
        return userRepository.findByEmail(principal.getUsername())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    private SchoolEventDto toDto(SchoolEvent e) {
        String createdByName = e.getCreatedBy() != null
                ? e.getCreatedBy().getFirstName() + " " + e.getCreatedBy().getLastName()
                : null;
        return new SchoolEventDto(
                e.getId(),
                e.getTitle(),
                e.getDescription(),
                e.getDate().toString(),
                e.getType().name(),
                e.getSchool()      != null ? e.getSchool().getId()           : null,
                e.getSchool()      != null ? e.getSchool().getName()         : null,
                e.getSchoolClass() != null ? e.getSchoolClass().getId()      : null,
                e.getSchoolClass() != null ? e.getSchoolClass().getName()    : null,
                createdByName
        );
    }
}
