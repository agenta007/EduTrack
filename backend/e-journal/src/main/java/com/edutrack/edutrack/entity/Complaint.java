package com.edutrack.e_journal.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;

/**
 * Records a behavioural complaint issued by a Teacher against a Student
 * in the context of a particular Schedule entry.
 */
@Entity
@Table(name = "complaints")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Complaint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "studentid", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scheduleid", nullable = false)
    private Schedule schedule;

    @NotBlank
    @Column(nullable = false, length = 500)
    private String description;

    @NotNull
    @Column(nullable = false)
    private LocalDate date;
}
