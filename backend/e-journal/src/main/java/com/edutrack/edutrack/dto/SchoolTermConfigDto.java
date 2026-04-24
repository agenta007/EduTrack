package com.edutrack.e_journal.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class SchoolTermConfigDto {
    private String startDate;       // "MM-dd"
    private String term2Start;      // "MM-dd"
    private String elementaryEnd;   // "MM-dd"
    private String progymnasiumEnd; // "MM-dd"
    private String gymnasiumEnd;    // "MM-dd"
}
