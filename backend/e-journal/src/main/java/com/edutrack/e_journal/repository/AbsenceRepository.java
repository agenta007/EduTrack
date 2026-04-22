package com.edutrack.e_journal.repository;

import com.edutrack.e_journal.entity.Absence;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AbsenceRepository extends JpaRepository<Absence, Long> {
    // Retrieves all absences associated with a specific school class by traversing the schedule relationship
    List<Absence> findAllBySchedule_SchoolClass_Id(Long classId);
    // Retrieves all absence records associated with a specific student ID
    List<Absence> findAllByStudent_Id(Long studentId);
}
