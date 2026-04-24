package com.edutrack.e_journal.repository;

import com.edutrack.e_journal.entity.Teacher;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TeacherRepository extends JpaRepository<Teacher, Long> {
    // Retrieves all teachers associated with a specific school by their school ID
    List<Teacher> findAllBySchool_Id(Long schoolId);
    // Retrieves all teachers who are not currently assigned to any specific school (e.g., potential hires)
    List<Teacher> findAllBySchoolIsNull();
}
