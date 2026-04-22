package com.edutrack.e_journal.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class SchoolScheduleEntryDto {
    private Long   id;
    private String type;       // ScheduleEntryType name
    private String label;
    private String startTime;  // "HH:mm"
    private String endTime;    // "HH:mm"
    private String eventDate;  // "yyyy-MM-dd", null unless SPECIAL_EVENT
    private Integer sortOrder;
}
