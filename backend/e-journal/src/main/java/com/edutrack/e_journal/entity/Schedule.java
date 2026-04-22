package com.edutrack.e_journal.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalTime;

/**
 * A Schedule entry binds a Class, Subject, and Teacher together for a given Term.
 * Grades and Absences are recorded against Schedule entries.
 * Term values: 1 = first term, 2 = second term.
 */
@Entity
@Table(name = "schedules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Schedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schoolid", nullable = false)
    private School school;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "classid", nullable = false)
    private SchoolClass schoolClass;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subjectid", nullable = false)
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacherid", nullable = false)
    private Teacher teacher;

    @Min(1) @Max(2)
    @Column(nullable = false)
    private Integer term;

    /** Day of week: 1 = Monday … 5 = Friday */
    @Min(1) @Max(5)
    @Column(name = "dayofweek", nullable = false)
    private Integer dayOfWeek;

    @NotNull
    @Column(name = "starttime", nullable = false)
    private LocalTime startTime;

    @NotNull
    @Column(name = "endtime", nullable = false)
    private LocalTime endTime;

    /** STANDARD, SIP, or EXTRACURRICULAR. Defaults to STANDARD. */
    @Enumerated(EnumType.STRING)
    @Column(name = "lecture_type", length = 20, nullable = false, columnDefinition = "varchar(20) default 'STANDARD'")
    @Builder.Default
    private LectureType lectureType = LectureType.STANDARD;

    /**
     * Whether absences are recorded for this entry.
     * Always true for STANDARD and SIP; can be false for EXTRACURRICULAR.
     */
    @Column(name = "track_attendance", nullable = false, columnDefinition = "boolean default true")
    @Builder.Default
    private Boolean trackAttendance = true;
}
