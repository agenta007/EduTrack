package com.edutrack.e_journal.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * A grade awarded to a Student for a particular Schedule entry.
 * Value range: 2.00 (fail) to 6.00 (excellent) — Bulgarian grading scale.
 */
@Entity
@Table(name = "grades")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Grade {

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
    @DecimalMin("2.00") @DecimalMax("6.00")
    @Column(nullable = false, precision = 3, scale = 2)
    private BigDecimal value;

    @CreationTimestamp
    @Column(name = "createdat", updatable = false)
    private LocalDateTime createdAt;
}
