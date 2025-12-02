package com.example.capstone.dto;

import lombok.Builder;
import lombok.Getter;
import java.time.LocalDate;

@Getter
@Builder
public class MyPageResponse {
    private String name;        // 사용자 이름 (예: 다학제)
    private String email;       // 이메일
    private LocalDate joinDate; // 가입일 (예: 2025.11.04)
}