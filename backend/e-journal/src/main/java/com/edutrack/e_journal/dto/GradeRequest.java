package com.edutrack.e_journal.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Getter
@NoArgsConstructor
public class GradeRequest {
    @NotNull private Long studentId;
    @NotNull private Long scheduleId;
    @NotNull @DecimalMin("2.00") @DecimalMax("6.00") private BigDecimal value;
}
