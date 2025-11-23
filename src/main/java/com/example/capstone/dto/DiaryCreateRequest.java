package com.example.capstone.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
public class DiaryCreateRequest {

    // 1. DiaryWrite.tsx -> title-section
    private String diaryTitle;

    // (이미지 파일은 별도의 API로 받는 것을 추천하지만, 일단 URL로 받는다고 가정)
    // private String coverImageUrl;

    // 2. DiaryWrite.tsx -> date-section
    private LocalDate startDate;
    private LocalDate endDate;
    private String departureCity;
    private String arrivalCity;

    // 3. DiaryWrite.tsx -> summary-section
    private Integer tripNights; // "3" (박)
    private Integer tripDays;   // "4" (일)
    private BigDecimal tripCost; // "1,130,000" (경비)

    // 4. 이 일기를 수동으로 쓰는지, 채팅으로 쓰는지 구분
    private String creationMethod; // "manual" 또는 "chat"

    // (참고) N박, N일, 경비를 프론트에서 String으로 보내신다면
    // private String tripNights;
    // private String tripDays;
    // private String tripCost;
    // ... Service에서 String을 Integer/BigDecimal로 파싱해야 합니다.
}