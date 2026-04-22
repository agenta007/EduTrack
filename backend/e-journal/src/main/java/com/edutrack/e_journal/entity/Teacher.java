package com.edutrack.e_journal.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

import java.util.HashSet;
import java.util.Set;

/**
 * A Teacher is a User with role TEACHER, extended with school assignment
 * and subject qualifications. Shares its primary key with User via @MapsId.
 */
@Entity
@Table(name = "teachers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Teacher {

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

    /** Monthly gross salary in BGN. Null if not set. */
    @Column(name = "salary", precision = 10, scale = 2)
    private BigDecimal salary;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "teacher_qualifications",
        joinColumns = @JoinColumn(name = "teacherid"),
        inverseJoinColumns = @JoinColumn(name = "subjectid")
    )
    @Builder.Default
    private Set<Subject> qualifications = new HashSet<>();
}
