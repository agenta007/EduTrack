package com.edutrack.e_journal.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

@Entity
@Table(name = "schools")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class School {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 150)
    @Column(nullable = false, length = 150)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", length = 30)
    private SchoolType type;

    /** The headmaster/director of this school. Nullable — school can exist without one assigned. */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "directorid")
    private User director;

    /** Maximum number of students allowed in this school. Null means no limit. */
    @Column(name = "student_limit")
    private Integer studentLimit;
}
