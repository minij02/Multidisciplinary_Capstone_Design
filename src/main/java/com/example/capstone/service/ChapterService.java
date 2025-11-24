package com.example.capstone.service;

import com.example.capstone.domain.OnboardingQuestion;
import com.example.capstone.domain.DailyEntry;
import com.example.capstone.domain.TravelChapter;
import com.example.capstone.domain.User;
import com.example.capstone.dto.ChapterListResponse;
import com.example.capstone.dto.EntryListItemResponse;
import com.example.capstone.dto.NewChapterRequest;
import com.example.capstone.repository.OnboardingQuestionRepository;
import com.example.capstone.repository.TravelChapterRepository;
import com.example.capstone.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ChapterService {

    private final TravelChapterRepository travelChapterRepository;
    private final OnboardingQuestionRepository onboardingQuestionRepository;
    private final UserRepository userRepository;

    /**
     * 온보딩 질문 답변을 저장하고 새 여행 챕터를 생성합니다.
     * @param userId 현재 로그인한 사용자 ID
     * @param request 클라이언트로부터 받은 온보딩 정보
     * @return 생성된 새 챕터의 ID
     */
    @Transactional
    public Long createNewChapter(Long userId, NewChapterRequest request) {
        // 1. 사용자 엔티티 조회
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("인증된 사용자 정보를 찾을 수 없습니다."));

        // 2. 온보딩 질문 답변 저장 (OnboardingQuestion 테이블)
        OnboardingQuestion onboard = new OnboardingQuestion();
        onboard.setUser(user);
        onboard.setStartDate(request.getStartDate());
        onboard.setTravelStyle(request.getTravelStyle());
        onboard.setTravelTheme(request.getTravelTheme());
        onboard.setTravelTitle(request.getTravelTitle());
        
        onboardingQuestionRepository.save(onboard);

        // 3. 새 여행 챕터 생성 및 저장 (TravelChapter 테이블)
        TravelChapter newChapter = new TravelChapter();
        newChapter.setUser(user);
        
        TravelChapter savedChapter = travelChapterRepository.save(newChapter);
        
        return savedChapter.getChapterId();
    }

    @Transactional(readOnly = true)
    public List<ChapterListResponse> getAllChaptersAndEntries(Long userId) {
        
        // 1. Fetch Join을 사용하여 DB에서 챕터와 일기 데이터를 한 번에 로드
        List<TravelChapter> chapters = travelChapterRepository.findAllWithEntriesByUserId(userId);

        // 2. 엔티티를 계층적 DTO로 변환
        return chapters.stream()
                .map(this::convertToChapterListResponse)
                .toList();
    }

    /**
     * TravelChapter 엔티티를 ChapterListResponse DTO로 변환합니다.
     */
    private ChapterListResponse convertToChapterListResponse(TravelChapter tc) {
        // DailyEntry 목록을 EntryListItemResponse DTO로 변환
        List<EntryListItemResponse> entries = tc.getEntries().stream()
                .map(this::convertToEntryListItemResponse)
                .toList();

        // 날짜 형식 포맷 (start_date, end_date가 LocalDate 타입이라고 가정)
        String period = formatTravelPeriod(tc);

        return ChapterListResponse.builder()
                .chapterId(tc.getChapterId())
                .title(tc.getTitle())
                .coverImageUrl(tc.getCoverImageUrl())
                .travelPeriod(period)
                .entries(entries)
                .build();
    }

    /**
     * DailyEntry 엔티티를 EntryListItemResponse DTO로 변환합니다.
     */
    private EntryListItemResponse convertToEntryListItemResponse(DailyEntry de) {
        return EntryListItemResponse.builder()
                .entryId(de.getEntryId())
                .subtitle(de.getSubtitle())
                .createdTime(de.getCreatedAt())
                .build();
    }
    
    /**
     * 여행 기간 포맷팅 헬퍼 메서드
     */
    private String formatTravelPeriod(TravelChapter tc) {
        if (tc.getStartDate() != null && tc.getEndDate() != null) {
            return tc.getStartDate().toString() + " - " + tc.getEndDate().toString();
        }
        // start_date만 있을 경우
        if (tc.getStartDate() != null) {
             return tc.getStartDate().toString() + " - 진행 중";
        }
        return "기간 미정";
    }
}