package com.edutrack.e_journal.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

/**
 * Represents a class (group of students) within a school for a given school year.
 * Named SchoolClass to avoid collision with java.lang.Class.
 * Mapped to the "classes" table.
 */
@Entity
@Table(name = "classes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SchoolClass {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 20)
    @Column(nullable = false, length = 20)
    private String name;

    /** Format: "2024/2025" */
    @NotBlank
    @Size(max = 9)
    @Column(name = "schoolyear", nullable = false, length = 9)
    private String schoolYear;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schoolid", nullable = false)
    private School school;
}
