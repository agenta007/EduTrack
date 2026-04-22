package com.edutrack.e_journal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class SchoolEventRequest {

    @NotBlank
    @Size(max = 150)
    private String title;

    @Size(max = 500)
    private String description;

    /** ISO date string: "yyyy-MM-dd" */
    @NotBlank
    private String date;

    /** One of: TEST, HOLIDAY, MEETING, OTHER */
    @NotNull
    private String type;

    /** Null = system-wide event. */
    private Long schoolId;

    /** Null = school-wide event. */
    private Long classId;
}
