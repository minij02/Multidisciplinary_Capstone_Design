package com.example.capstone.service;

import com.example.capstone.domain.OnboardingQuestion;
import com.example.capstone.domain.TravelChapter;
import com.example.capstone.domain.User;
import com.example.capstone.dto.NewChapterRequest;
import com.example.capstone.repository.OnboardingQuestionRepository;
import com.example.capstone.repository.TravelChapterRepository;
import com.example.capstone.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
        onboard.setTravelStyle(request.getTravelStyle());
        onboard.setTravelTheme(request.getTravelTheme());
        onboard.setTravelFrequency(request.getTravelFrequency());
        
        onboardingQuestionRepository.save(onboard);

        // 3. 새 여행 챕터 생성 및 저장 (TravelChapter 테이블)
        TravelChapter newChapter = new TravelChapter();
        newChapter.setUser(user);
        
        // 제목은 일단 null로 저장하고 추후 입력
        newChapter.setTitle(null); 
        
        TravelChapter savedChapter = travelChapterRepository.save(newChapter);
        
        return savedChapter.getChapterId();
    }
}