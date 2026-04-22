package com.edutrack.e_journal.repository;

import com.edutrack.e_journal.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StudentRepository extends JpaRepository<Student, Long> {
    // Retrieves all students belonging to a specific school by their school ID
    List<Student> findAllBySchool_Id(Long schoolId);
    // Retrieves all students enrolled in a specific school class by their class ID
    List<Student> findAllBySchoolClass_Id(Long classId);
    // Retrieves all students who are not currently assigned to any school
    List<Student> findAllBySchoolIsNull();
    // Retrieves all students associated with a specific parent ID
    List<Student> findAllByParent_Id(Long parentId);
    // Retrieves all students belonging to a specific school who are already linked to a parent
    List<Student> findAllBySchool_IdAndParentIsNotNull(Long schoolId);
    // Counts the number of students currently enrolled in a specific school
    long countBySchool_Id(Long schoolId);
}
