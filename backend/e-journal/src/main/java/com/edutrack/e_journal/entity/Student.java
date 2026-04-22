package com.edutrack.e_journal.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * A Student is a User with role STUDENT, extended with school and class assignment.
 * Shares its primary key with User via @MapsId.
 */
@Entity
@Table(name = "students")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Student {

    /** Same value as the associated User's id. */
    @Id
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "userid")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schoolid", nullable = true)
    private School school;

    /** Nullable — a student may be enrolled in a school without a class assignment yet. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "classid")
    private SchoolClass schoolClass;

    /** Nullable — the profile this student follows at their school (e.g. "English Profile"). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profileid")
    private SchoolProfile profile;

    /** Nullable — the parent account shared by the student's family. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parentid")
    private User parent;
}
