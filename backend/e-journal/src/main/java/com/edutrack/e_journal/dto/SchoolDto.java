package com.edutrack.e_journal.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class SchoolDto {
    private Long         id;
    private String       name;
    private String       address;
    private String       type;           // SchoolType name, nullable
    private String       headmasterName; // null if no headmaster assigned
    private List<ProfileDto> profiles;
    private Integer      studentLimit;   // null means no limit

    @Getter
    @AllArgsConstructor
    public static class ProfileDto {
        private Long   id;
        private String name;
    }
}
