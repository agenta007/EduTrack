package com.edutrack.e_journal.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class CreateUserRequest {

    @NotBlank @Size(max = 50)
    private String firstName;

    @NotBlank @Size(max = 50)
    private String lastName;

    @NotBlank @Email @Size(max = 100)
    private String email;

    @NotBlank
    private String password;

    @NotNull
    private String role; // e.g. "ADMIN", "TEACHER", etc.
}
