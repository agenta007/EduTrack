package com.edutrack.e_journal.repository;

import com.edutrack.e_journal.entity.SchoolEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SchoolEventRepository extends JpaRepository<SchoolEvent, Long> {

    /**
     * Returns all events visible to a student:
     *  - system-wide events (school = null, class = null)
     *  - school-wide events for their school (class = null)
     *  - class-specific events for their class
     */
    @Query("""
        SELECT e FROM SchoolEvent e
        LEFT JOIN e.school s
        LEFT JOIN e.schoolClass c
        WHERE (s IS NULL AND c IS NULL)
           OR (s.id = :schoolId AND c IS NULL)
           OR (s.id = :schoolId AND c.id = :classId)
        ORDER BY e.date ASC
        """)
    List<SchoolEvent> findForStudent(@Param("schoolId") Long schoolId,
                                     @Param("classId")  Long classId);

    List<SchoolEvent> findAllBySchoolClass_IdOrderByDateAsc(Long classId);

    List<SchoolEvent> findAllBySchool_IdOrderByDateAsc(Long schoolId);
}
