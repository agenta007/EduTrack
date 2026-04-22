package com.edutrack.e_journal.repository;

import com.edutrack.e_journal.entity.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ScheduleRepository extends JpaRepository<Schedule, Long> {
    // Retrieve all schedules associated with the specified school class ID
    List<Schedule> findAllBySchoolClass_Id(Long classId);
    // Retrieve all schedules associated with the specified teacher ID
    // Retrieves all scheduled lectures assigned to a specific teacher
    List<Schedule> findAllByTeacher_Id(Long teacherId);
}
