package com.edutrack.e_journal.repository;

import com.edutrack.e_journal.entity.School;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SchoolRepository extends JpaRepository<School, Long> {
    // Retrieves the school managed by a specific director
    Optional<School> findByDirector_Id(Long directorId);
}
