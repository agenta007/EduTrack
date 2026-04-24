package com.edutrack.e_journal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class AbsenceRequest {
    @NotNull  private Long   studentId;
    @NotNull  private Long   scheduleId;
    @NotBlank private String date; // "yyyy-MM-dd"
}
