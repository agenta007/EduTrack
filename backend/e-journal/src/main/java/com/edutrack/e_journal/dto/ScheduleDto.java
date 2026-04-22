package com.edutrack.e_journal.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ScheduleDto {
    private Long    id;
    private Long    subjectId;
    private String  subjectName;
    private Long    teacherId;
    private String  teacherName;
    private Long    classId;
    private String  className;
    private String  schoolName;
    private Integer term;
    private Integer dayOfWeek;
    private String  startTime;      // "HH:mm"
    private String  endTime;        // "HH:mm"
    private String  lectureType;    // "STANDARD" | "SIP" | "EXTRACURRICULAR"
    private Boolean trackAttendance;
}
