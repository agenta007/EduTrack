package com.edutrack.e_journal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class SchoolRequest {

    @NotBlank
    @Size(max = 150)
    private String name;

    private String address;

    private Long   headmasterId;
    private String type; // SchoolType name, nullable
}
