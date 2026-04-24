package com.edutrack.e_journal.repository;

import com.edutrack.e_journal.entity.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
    // Retrieves all complaints associated with a specific school class by traversing the schedule relationship
    List<Complaint> findAllBySchedule_SchoolClass_Id(Long classId);
    List<Complaint> findAllByStudent_Id(Long studentId);
}
