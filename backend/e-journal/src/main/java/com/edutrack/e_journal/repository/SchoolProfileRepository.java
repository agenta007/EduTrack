package com.edutrack.e_journal.repository;

import com.edutrack.e_journal.entity.SchoolProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SchoolProfileRepository extends JpaRepository<SchoolProfile, Long> {
    // Retrieves all school profiles associated with a specific school ID
    List<SchoolProfile> findAllBySchool_Id(Long schoolId);
}
