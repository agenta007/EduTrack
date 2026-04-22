package com.edutrack.e_journal.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Per-school configuration for term/school-year date boundaries.
 * All dates stored as "MM-dd" strings (e.g. "09-15").
 * Shares primary key with School via @MapsId.
 */
@Entity
@Table(name = "school_term_configs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SchoolTermConfig {

    @Id
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "schoolid")
    private School school;

    /** Start of school year (term 1 start). Default: September 15. */
    @Column(nullable = false)
    private String startDate = "09-15";

    /** Start of term 2 (in the next calendar year from school start). Default: February 1. */
    @Column(nullable = false)
    private String term2Start = "02-01";

    /** End of school year for grades 1-4 (elementary). Default: June 1. */
    @Column(nullable = false)
    private String elementaryEnd = "06-01";

    /** End of school year for grades 5-7 (progymnasium). Default: June 15. */
    @Column(nullable = false)
    private String progymnasiumEnd = "06-15";

    /** End of school year for grades 8-12 (gymnasium). Default: July 1. */
    @Column(nullable = false)
    private String gymnasiumEnd = "07-01";
}
