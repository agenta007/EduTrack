package com.edutrack.e_journal.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class GradeDto {
    private Long   id;
    private Long   studentId;
    private String studentName;
    private Long   scheduleId;
    private Long   subjectId;
    private String subjectName;
    private String teacherName;
    private Integer term;
    private String value;      // formatted e.g. "5.50"
    private String createdAt;  // ISO datetime
}
