package com.edutrack.e_journal.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;

/**
 * Records a Student's absence from a particular Schedule session.
 */
@Entity
@Table(name = "absences")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Absence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "studentid", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scheduleid", nullable = false)
    private Schedule schedule;

    @NotNull
    @Column(nullable = false)
    private LocalDate date;

    @Column(name = "isexcused", nullable = false)
    @Builder.Default
    private Boolean isExcused = false;
}
