package com.edutrack.e_journal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class SchoolScheduleEntryRequest {

    @NotBlank
    private String type;        // ScheduleEntryType name

    @NotBlank
    @Size(max = 100)
    private String label;

    @NotBlank
    private String startTime;   // "HH:mm"

    @NotBlank
    private String endTime;     // "HH:mm"

    private String eventDate;   // "yyyy-MM-dd", nullable

    private Integer sortOrder;  // auto-assigned if null
}
