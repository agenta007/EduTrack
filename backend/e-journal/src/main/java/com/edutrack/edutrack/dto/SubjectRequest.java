package com.edutrack.e_journal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class SubjectRequest {

    @NotBlank
    @Size(max = 100)
    private String name;
}
