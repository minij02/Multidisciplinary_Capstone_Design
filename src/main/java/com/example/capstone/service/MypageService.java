package com.example.capstone.service;

import com.example.capstone.domain.User;
import com.example.capstone.dto.MainPageResponse;
import com.example.capstone.repository.DailyEntryRepository;
import com.example.capstone.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MypageService {

    private final UserRepository userRepository;
    private final DailyEntryRepository dailyEntryRepository;

    /**
     * 메인 페이지 (마이 페이지)에 필요한 모든 데이터를 조회합니다.
     */
    @Transactional(readOnly = true)
    public MainPageResponse getMyPageData(Long userId) {
        
        // 1. 사용자 기본 정보 조회
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자 정보를 찾을 수 없습니다."));

        // 2. 총 일기 수 조회
        Long totalCount = dailyEntryRepository.countAllByUserId(userId);
        
        // 3. 일기가 작성된 날짜 목록 조회 (달력용)
        // 이 날짜들을 클라이언트가 받아서 캘린더에 표시합니다.
        List<LocalDate> dates = dailyEntryRepository.findDiaryDatesByUserId(userId);

        // 4. 응답 DTO 구성 및 반환
        return MainPageResponse.builder()
                .userId(user.getUserId())
                .userName(user.getName())
                .userEmail(user.getEmail())
                .totalDiaryCount(totalCount)
                .favoriteDiaryCount(0L) // 즐겨찾기 기능 미구현으로 임시 0 설정
                .diaryDates(dates)
                .build();
    }
}