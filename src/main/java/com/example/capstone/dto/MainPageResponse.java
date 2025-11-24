package com.example.capstone.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import java.util.List;
import java.time.LocalDate;

@Getter
@Setter
@Builder
public class MainPageResponse {
    
    // 사용자 기본 정보
    private Long userId;
    private String userName;
    private String userEmail;

    // 통계 정보
    private Long totalDiaryCount;
    private Long favoriteDiaryCount; // 즐겨찾기 수는 현재 엔티티에 없으므로 임시로 0으로 가정

    // 캘린더 정보 (일기가 작성된 날짜 목록)
    private List<LocalDate> diaryDates;
}