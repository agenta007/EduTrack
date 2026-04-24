package com.edutrack.e_journal.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@AllArgsConstructor
public class TeacherDto {
    private Long         id;
    private String       name;
    private String       email;
    private BigDecimal   salary;
    private List<SubjectItem> qualifications;
    private int          classCount;

    @Getter
    @AllArgsConstructor
    public static class SubjectItem {
        private Long   id;
        private String name;
    }
}
