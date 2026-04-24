package com.edutrack.e_journal.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "school_schedule_entries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SchoolScheduleEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schoolid", nullable = false)
    private School school;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private ScheduleEntryType type;

    @NotBlank
    @Size(max = 100)
    @Column(name = "label", nullable = false, length = 100)
    private String label;

    @NotNull
    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @NotNull
    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    /** Only set for SPECIAL_EVENT entries. */
    @Column(name = "event_date")
    private LocalDate eventDate;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;
}
