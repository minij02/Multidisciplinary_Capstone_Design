package com.example.capstone.dto;

import lombok.Builder;
import lombok.Getter;
import java.util.List;

@Getter
@Builder
public class ChapterListResponse {
    private Long chapterId;
    private String title;
    private String coverImageUrl;
    private String travelPeriod;
    
    // 이 챕터에 속한 일기 목록
    private List<EntryListItemResponse> entries;
}