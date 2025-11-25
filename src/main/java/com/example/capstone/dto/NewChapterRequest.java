package com.example.capstone.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull; 
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate; 

@Getter
@Setter
public class NewChapterRequest {

    // Q1-1: 여행 시작 날짜
    @NotNull(message = "여행 시작 날짜는 필수입니다.")
    private LocalDate startDate; 

    // Q1-2: 여행 종료 날짜
    @NotNull(message = "여행 종료 날짜는 필수입니다.")
    
    private LocalDate endDate;
    // Q2: 여행 스타일 (Onboarding -2)
    @NotBlank(message = "여행 스타일은 필수입니다.")
    private String travelStyle; 

    // Q3: 여행 테마 (Onboarding -3)
    @NotBlank(message = "여행 테마는 필수입니다.")
    private String travelTheme;

    // Q4: 여행 제목 (Onboarding -4)
    @NotBlank(message = "여행 제목은 필수입니다.")
    private String travelTitle;
}