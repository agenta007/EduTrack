package com.edutrack.e_journal.repository;

import com.edutrack.e_journal.entity.Role;
import com.edutrack.e_journal.entity.RoleEnum;
import org.springframework.data.repository.CrudRepository;

import java.util.Optional;

public interface RoleRepository extends CrudRepository<Role, Long> {
    // Retrieve a specific role from the database by its enum name
    Optional<Role> findByName(RoleEnum name);
}
