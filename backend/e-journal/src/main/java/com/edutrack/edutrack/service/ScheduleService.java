package com.edutrack.e_journal.service;

import com.edutrack.e_journal.dto.ScheduleDto;
import com.edutrack.e_journal.dto.ScheduleRequest;
import com.edutrack.e_journal.entity.*;
import com.edutrack.e_journal.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ScheduleService {

    private final ScheduleRepository scheduleRepository;
    private final ClassRepository    classRepository;
    private final SubjectRepository  subjectRepository;
    private final TeacherRepository  teacherRepository;
    private final UserRepository     userRepository;

    public List<ScheduleDto> getByClass(Long classId) {
        // Retrieve all schedule entries associated with the specified school class and map them to DTOs
        return scheduleRepository.findAllBySchoolClass_Id(classId).stream()
                .map(this::toDto).toList();
    }

    public List<ScheduleDto> getByTeacher(Long teacherId) {
        // Retrieve all schedule entries associated with the specified teacher and map them to DTOs
        return scheduleRepository.findAllByTeacher_Id(teacherId).stream()
                .map(this::toDto).toList();
    }

    public List<ScheduleDto> getMySchedule(UserDetails principal) {
        // Retrieve the authenticated user by their email address
        User user = userRepository.findByEmail(principal.getUsername())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        // Fetch all schedule entries assigned to this teacher and map them to DTOs
        return scheduleRepository.findAllByTeacher_Id(user.getId()).stream()
                .map(this::toDto).toList();
    }

    public ScheduleDto create(ScheduleRequest req) {
        // Create a new schedule entry from the provided request DTO
        // Load the managed SchoolClass entity and validate existence
        SchoolClass schoolClass = classRepository.findById(req.getClassId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Class not found"));
        // Load the managed Subject entity and validate existence
        Subject subject = subjectRepository.findById(req.getSubjectId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Subject not found"));
        // Load the managed Teacher entity and validate existence
        Teacher teacher = teacherRepository.findById(req.getTeacherId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Teacher not found"));

        // Apply default values for lecture type and attendance tracking if not provided in the request
        LectureType lectureType   = req.getLectureType() != null ? req.getLectureType() : LectureType.STANDARD;
        boolean trackAttendance   = req.getTrackAttendance() != null ? req.getTrackAttendance() : true;

        // Map the request data and retrieved entities to a new Schedule entity using the builder pattern
        Schedule schedule = Schedule.builder()
                .school(schoolClass.getSchool())
                .schoolClass(schoolClass)
                .subject(subject)
                .teacher(teacher)
                .term(req.getTerm())
                .dayOfWeek(req.getDayOfWeek())
                .startTime(LocalTime.parse(req.getStartTime()))
                .endTime(LocalTime.parse(req.getEndTime()))
                .lectureType(lectureType)
                .trackAttendance(trackAttendance)
                .build();

        // Persist the new schedule to the database and map the result back to a DTO
        return toDto(scheduleRepository.save(schedule));
    }

    public ScheduleDto patchType(Long id, LectureType lectureType, Boolean trackAttendance) {
        // Update specific fields of an existing schedule entry via partial patching
        // Load the managed Schedule entity or throw 404 if not found
        Schedule s = scheduleRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Schedule entry not found"));
        // Apply the new lecture type if provided in the request
        if (lectureType != null)     s.setLectureType(lectureType);
        // Update the attendance tracking flag if provided in the request
        if (trackAttendance != null) s.setTrackAttendance(trackAttendance);
        // Persist changes to the database and return the updated DTO
        return toDto(scheduleRepository.save(s));
    }

    public void delete(Long id) {
        // Remove a schedule entry by its unique identifier
        // Check if the schedule entry exists in the database
        if (!scheduleRepository.existsById(id))
            // Return 404 Not Found if the ID does not match any existing record
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Schedule entry not found");
        // Perform the deletion of the managed entity
        scheduleRepository.deleteById(id);
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private ScheduleDto toDto(Schedule s) {
        // Map the managed Schedule entity to a flattened DTO for API consumption
        // Construct the teacher's full name by traversing the Teacher -> User relationship
        String teacherName = s.getTeacher().getUser().getFirstName()
                + " " + s.getTeacher().getUser().getLastName();
        // Initialize the DTO with IDs and descriptive names to avoid deep nesting in the frontend
        return new ScheduleDto(
                s.getId(),
                s.getSubject().getId(),
                s.getSubject().getName(),
                s.getTeacher().getId(),
                teacherName,
                s.getSchoolClass().getId(),
                s.getSchoolClass().getName(),
                s.getSchool().getName(),
                s.getTerm(),
                s.getDayOfWeek(),
                s.getStartTime().toString(),
                s.getEndTime().toString(),
                s.getLectureType().name(),
                s.getTrackAttendance()
        );
    }
}
