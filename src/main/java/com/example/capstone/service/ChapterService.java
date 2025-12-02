package com.example.capstone.service;

import com.example.capstone.domain.OnboardingQuestion;
import com.example.capstone.domain.DiaryEntry;
import com.example.capstone.domain.TripChapter;
import com.example.capstone.domain.User;
import com.example.capstone.dto.ChapterListResponse;
import com.example.capstone.dto.DiaryCreateRequest;
import com.example.capstone.dto.EntryListItemResponse;
import com.example.capstone.dto.NewChapterRequest;
import com.example.capstone.repository.DiaryEntryRepository;
import com.example.capstone.repository.OnboardingQuestionRepository;
import com.example.capstone.repository.TripChapterRepository;
import com.example.capstone.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChapterService {

    private final TripChapterRepository tripChapterRepository;
    private final OnboardingQuestionRepository onboardingQuestionRepository;
    private final DiaryEntryRepository diaryEntryRepository;
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
        TripChapter newChapter = new TripChapter();
        newChapter.setUser(user);

        newChapter.setOnboardingQuestion(onboard); // 저장된 온보딩 질문을 챕터에 연결
        
        newChapter.setTitle(request.getTravelTitle()); 

        newChapter.setStartDate(request.getStartDate());
       
        newChapter.setEndDate(request.getEndDate()); 

        newChapter.setIsPublished(false); 
        newChapter.setTotalCost(BigDecimal.ZERO);
        newChapter.setKey(UUID.randomUUID().toString()); 
        
        TripChapter savedChapter = tripChapterRepository.save(newChapter);
        
        return savedChapter.getId();
    }

    @Transactional(readOnly = true)
    public List<ChapterListResponse> getAllChaptersAndEntries(Long userId) {
        
        // 1. Fetch Join을 사용하여 DB에서 챕터와 일기 데이터를 한 번에 로드
        List<TripChapter> chapters = tripChapterRepository.findAllWithEntriesByUserId(userId);

        // 2. 엔티티를 계층적 DTO로 변환
        return chapters.stream()
                .map(this::convertToChapterListResponse)
                .toList();
    }

    /**
     * TripChapter 엔티티를 ChapterListResponse DTO로 변환합니다.
     */
    private ChapterListResponse convertToChapterListResponse(TripChapter tc) {
        // DiaryEntry 목록을 EntryListItemResponse DTO로 변환
        List<EntryListItemResponse> entries = tc.getDiaryEntries().stream()
                .map(this::convertToEntryListItemResponse)
                .toList();

        // 날짜 형식 포맷 (start_date, end_date가 LocalDate 타입이라고 가정)
        String period = formatTravelPeriod(tc);

        return ChapterListResponse.builder()
                .chapterId(tc.getId())
                .title(tc.getTitle())
                .coverImageUrl(tc.getCoverImageUrl())
                .travelPeriod(period)
                .entries(entries)
                .build();
    }

    /**
     * DiaryEntry 엔티티를 EntryListItemResponse DTO로 변환합니다.
     */
    private EntryListItemResponse convertToEntryListItemResponse(DiaryEntry de) {
        return EntryListItemResponse.builder()
                .entryId(de.getId())
                .subtitle(de.getSubtitle())
                .createdTime(de.getCreatedAt())
                .build();
    }
    
    /**
     * 여행 기간 포맷팅 헬퍼 메서드
     */
    private String formatTravelPeriod(TripChapter tc) {
        if (tc.getStartDate() != null && tc.getEndDate() != null) {
            return tc.getStartDate().toString() + " - " + tc.getEndDate().toString();
        }
        // start_date만 있을 경우
        if (tc.getStartDate() != null) {
             return tc.getStartDate().toString() + " - 진행 중";
        }
        return "기간 미정";
    }

     /**
     * [신규] 기존 챕터에 새 일기 항목을 추가합니다.
     */
    @Transactional
    public Long addEntryToExistingChapter(Long userId, Long chapterId, DiaryCreateRequest request) {
        // 1. 챕터 조회 및 권한 확인
        TripChapter chapter = tripChapterRepository.findById(chapterId)
                .orElseThrow(() -> new IllegalArgumentException("챕터를 찾을 수 없습니다."));
        
        if (!chapter.getUser().getUserId().equals(userId)) {
            throw new IllegalArgumentException("권한이 없습니다.");
        }

        // 2. 새 일기 생성
        DiaryEntry entry = new DiaryEntry();
        entry.setTripChapter(chapter); // 기존 챕터 연결
        entry.setDate(request.getStartDate()); // 일기 날짜
        entry.setSubtitle(request.getDiaryTitle()); // 제목
        entry.setContent("... AI 분석 대기 중 ...");
        entry.setCreationMethod("chat");
        
        // 3. 챕터의 수정 시간 갱신 (선택 사항: JPA Auditing이 챕터 변경을 감지하지 못할 경우 명시적 업데이트)
        // chapter.setUpdatedAt(LocalDateTime.now()); 

        DiaryEntry savedEntry = diaryEntryRepository.save(entry);
        return savedEntry.getId();
    }
}