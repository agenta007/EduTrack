package com.edutrack.e_journal.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Email
    @Size(max = 100)
    @Column(name = "email", unique = true, nullable = false, length = 100)
    private String email;

    @NotBlank
    @Size(max = 255)
    @Column(name = "passwordhash", nullable = false, length = 255)
    private String passwordHash;

    @NotBlank
    @Size(max = 50)
    @Column(name = "firstname", nullable = false, length = 50)
    private String firstName;

    @NotBlank
    @Size(max = 50)
    @Column(name = "lastname", nullable = false, length = 50)
    private String lastName;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "roleid", nullable = false)
    private Role role;

    @Column(name = "profile_picture", columnDefinition = "bytea")
    private byte[] profilePicture;

    @Column(name = "profile_picture_type", length = 50)
    private String profilePictureType;

    @Size(max = 500)
    @Column(name = "bio", length = 500)
    private String bio;

}
