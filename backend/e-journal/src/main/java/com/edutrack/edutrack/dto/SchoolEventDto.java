package com.edutrack.e_journal.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class SchoolEventDto {
    private Long   id;
    private String title;
    private String description;
    private String date;        // "yyyy-MM-dd"
    private String type;        // EventType name
    private Long   schoolId;
    private String schoolName;
    private Long   classId;
    private String className;
    private String createdByName;
}
