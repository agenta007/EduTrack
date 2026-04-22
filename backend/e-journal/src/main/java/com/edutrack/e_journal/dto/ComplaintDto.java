package com.edutrack.e_journal.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ComplaintDto {
    private Long    id;
    private Long    studentId;
    private String  studentName;
    private Long    scheduleId;
    private Long    subjectId;
    private String  subjectName;
    private String  teacherName;
    private Integer term;
    private String  date;         // "yyyy-MM-dd"
    private String  description;
}
