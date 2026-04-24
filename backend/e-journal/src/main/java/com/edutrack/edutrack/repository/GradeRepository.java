package com.edutrack.e_journal.repository;

import com.edutrack.e_journal.entity.Grade;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GradeRepository extends JpaRepository<Grade, Long> {
    // Retrieves all grades associated with a specific school class ID
    List<Grade> findAllBySchedule_SchoolClass_Id(Long classId);
    // Retrieves all grades associated with a specific student by their unique identifier
    List<Grade> findAllByStudent_Id(Long studentId);
}
