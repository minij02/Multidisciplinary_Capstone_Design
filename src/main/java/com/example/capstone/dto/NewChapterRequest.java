package com.example.capstone.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class NewChapterRequest {

    // 온보딩 질문 Q1: 어떤 여행을 기록하고 싶으신가요?
    @NotBlank(message = "여행 스타일은 필수입니다.")
    private String travelStyle; 

    // 온보딩 질문 Q2: 여행의 테마는 무엇인가요?
    @NotBlank(message = "여행 테마는 필수입니다.")
    private String travelTheme;

    // 온보딩 질문 Q3: 얼마나 자주 기록하고 싶으신가요?
    @NotBlank(message = "기록 빈도는 필수입니다.")
    private String travelFrequency;
}