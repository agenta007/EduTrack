package com.edutrack.e_journal.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * A calendar event visible to students and parents.
 * Scope rules:
 *   school=null, schoolClass=null  → system-wide (national holidays)
 *   school=X,    schoolClass=null  → school-wide event
 *   school=X,    schoolClass=Y     → class-specific event (e.g. a test)
 */
@Entity
@Table(name = "school_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SchoolEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 150)
    @Column(nullable = false, length = 150)
    private String title;

    @Size(max = 500)
    @Column(length = 500)
    private String description;

    @NotNull
    @Column(nullable = false)
    private LocalDate date;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EventType type;

    /** Null = system-wide (e.g. national holiday). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schoolid")
    private School school;

    /** Null = applies to the whole school (or system-wide if school is also null). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "classid")
    private SchoolClass schoolClass;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
