package com.example.capstone.controller;

import com.example.capstone.dto.ChapterListResponse;
import com.example.capstone.dto.NewChapterRequest;
import com.example.capstone.service.ChapterService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.example.capstone.security.PrincipalDetails;

import java.util.List;

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
            // 사용자 정보를 찾지 못했거나 기타 오류 발생 시
            return new ResponseEntity<>(null, HttpStatus.BAD_REQUEST);
        }
    }

    /**
     * [일기 페이지] 특정 사용자의 모든 챕터 및 일기 목록을 반환합니다.
     * GET /api/chapters/list
     * (인증된 사용자만 접근 가능)
     */
    @GetMapping("/list")
    public ResponseEntity<List<ChapterListResponse>> getChapterList(Authentication authentication) {
        
        // 1. Spring Security Context에서 인증된 사용자 ID 획득
        PrincipalDetails principalDetails = (PrincipalDetails) authentication.getPrincipal();
        Long userId = principalDetails.getUser().getUserId();
        
        try {
            // 2. 서비스 호출
            List<ChapterListResponse> response = chapterService.getAllChaptersAndEntries(userId);
            
            // 3. 성공 응답
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            // 사용자 정보를 찾지 못했거나 기타 오류 발생 시
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}