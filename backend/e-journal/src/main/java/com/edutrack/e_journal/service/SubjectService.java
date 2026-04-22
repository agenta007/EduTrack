package com.edutrack.e_journal.service;

import com.edutrack.e_journal.dto.SubjectDto;
import com.edutrack.e_journal.dto.SubjectRequest;
import com.edutrack.e_journal.entity.Subject;
import com.edutrack.e_journal.repository.SubjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SubjectService {

    private final SubjectRepository subjectRepository;

    public List<SubjectDto> getAll() {
        // Retrieve all subjects from the database and map them to DTOs
        return subjectRepository.findAll().stream()
                // Transform each Subject entity into a lightweight SubjectDto
                .map(s -> new SubjectDto(s.getId(), s.getName()))
                .toList();
    }

    public SubjectDto create(SubjectRequest req) {
        // Persist a new Subject entity using the name from the request DTO
        Subject saved = subjectRepository.save(Subject.builder().name(req.getName()).build());
        // Map the persisted entity back to a SubjectDto for the API response
        return new SubjectDto(saved.getId(), saved.getName());
    }

    public SubjectDto update(Long id, SubjectRequest req) {
        // Retrieve the managed Subject entity by its primary key or abort if missing
        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Subject not found"));
    
        // Update the entity state with the new name from the request DTO
        subject.setName(req.getName());
    
        // Persist changes to the database and capture the updated entity
        Subject saved = subjectRepository.save(subject);
    
        // Map the persisted entity back to a response DTO
        return new SubjectDto(saved.getId(), saved.getName());
    }

    public void delete(Long id) {
        // Remove a subject from the database by its unique identifier
        // Verify the subject exists before attempting deletion to prevent silent failures
        if (!subjectRepository.existsById(id))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Subject not found");
    
        // Execute the deletion of the managed Subject entity
        subjectRepository.deleteById(id);
    }
}
