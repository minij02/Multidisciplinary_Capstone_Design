package com.example.capstone.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
public class DiaryDetailResponse {
    
    // 기본 일기 항목 정보 (DiaryEntry 기반)
    private Long entryId;
    private LocalDate date;      // 일기 해당 날짜
    private String subtitle;    // 소제목
    private String content;     // 일기 본문
    private String creationMethod; // 생성 방식

    // 첨부 파일 정보 (AttachedFile 엔티티 기반)
    private List<String> mediaUrls; // 첨부 파일 URL 목록

    // 챕터 정보 (TripChapter 엔티티 기반)
    private Long chapterId;
    private String chapterTitle; // 챕터 제목 (예: 도쿄에서의 첫날)
    private LocalDateTime chapterCreationTime; // 챕터 생성 시간
}