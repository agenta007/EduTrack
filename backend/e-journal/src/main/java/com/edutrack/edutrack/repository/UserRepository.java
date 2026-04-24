package com.edutrack.e_journal.repository;

import com.edutrack.e_journal.entity.RoleEnum;
import com.edutrack.e_journal.entity.User;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends CrudRepository<User, Long> {

    // Retrieves a user by their unique email address
    Optional<User> findByEmail(String email);

    // Check if a user already exists in the database with the provided email address
    boolean existsByEmail(String email);

    // Retrieves all users associated with a specific security role
    List<User> findAllByRole_Name(RoleEnum role);

    /** STUDENT-role users not yet enrolled in any school (no student record or school is null). */
    // Retrieve all users with the STUDENT role who are not yet enrolled in any school
    @Query("SELECT u FROM User u WHERE u.role.name = com.edutrack.e_journal.entity.RoleEnum.STUDENT " +
           "AND u.id NOT IN (SELECT s.id FROM Student s WHERE s.school IS NOT NULL)")
    List<User> findAvailableStudents();

    /** TEACHER-role users not yet assigned to any school (no teacher record or school is null). */
    // Retrieves all users with the TEACHER role who are not yet associated with any school
    @Query("SELECT u FROM User u WHERE u.role.name = com.edutrack.e_journal.entity.RoleEnum.TEACHER " +
           "AND u.id NOT IN (SELECT t.id FROM Teacher t WHERE t.school IS NOT NULL)")
    List<User> findAvailableTeachers();
}
