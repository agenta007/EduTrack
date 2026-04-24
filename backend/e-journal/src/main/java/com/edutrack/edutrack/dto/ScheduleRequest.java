package com.edutrack.e_journal.dto;

import com.edutrack.e_journal.entity.LectureType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ScheduleRequest {

    @NotNull
    private Long classId;

    @NotNull
    private Long subjectId;

    @NotNull
    private Long teacherId;

    @NotNull @Min(1) @Max(2)
    private Integer term;

    @NotNull @Min(1) @Max(5)
    private Integer dayOfWeek;

    @NotBlank
    private String startTime;  // "HH:mm"

    @NotBlank
    private String endTime;    // "HH:mm"

    /** Optional — defaults to STANDARD if null. */
    private LectureType lectureType;

    /** Optional — defaults to true if null. Relevant only for EXTRACURRICULAR. */
    private Boolean trackAttendance;
}
