package com.edutrack.e_journal.repository;

import com.edutrack.e_journal.entity.Subject;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubjectRepository extends JpaRepository<Subject, Long> {
}
