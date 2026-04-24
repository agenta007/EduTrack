package com.edutrack.e_journal.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class ParentDto {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private List<StudentItem> children;

    @Getter
    @AllArgsConstructor
    public static class StudentItem {
        private Long id;
        private String name;
    }
}
