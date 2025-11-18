package com.example.capstone.controller;

import com.example.capstone.dto.NewChapterRequest;
import com.example.capstone.service.ChapterService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.example.capstone.security.PrincipalDetails;

@RestController
@RequestMapping("/api/chapters")
@RequiredArgsConstructor
public class ChapterController {

    private final ChapterService chapterService;

    /**
     * [새 챕터 생성] 온보딩 질문 완료 후 새 챕터와 질문 답변을 저장합니다.
     * POST /api/chapters/new
     * (인증된 사용자만 접근 가능)
     */
    @PostMapping("/new")
    public ResponseEntity<Long> createNewChapter(
            @Valid @RequestBody NewChapterRequest request,
            Authentication authentication // Spring Security 인증 객체 주입
    ) {
        // 1. 인증된 사용자 ID 획득 (PrincipalDetails 사용)
        PrincipalDetails principalDetails = (PrincipalDetails) authentication.getPrincipal();
        Long userId = principalDetails.getUser().getUserId();
        
        try {
            // 2. 챕터 생성 서비스 호출
            Long chapterId = chapterService.createNewChapter(userId, request);
            
            // 3. 성공 시, 생성된 챕터 ID 반환
            return new ResponseEntity<>(chapterId, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(null, HttpStatus.BAD_REQUEST);
        }
    }
}