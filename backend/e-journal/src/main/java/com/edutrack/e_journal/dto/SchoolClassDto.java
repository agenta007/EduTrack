package com.edutrack.e_journal.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class SchoolClassDto {
    private Long   id;
    private String name;
    private String schoolYear;
    private Long   schoolId;
    private String schoolName;
}
