package com.example.capstone.controller;

import com.example.capstone.dto.MainPageResponse;
import com.example.capstone.security.PrincipalDetails;
import com.example.capstone.service.MypageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/page")
@RequiredArgsConstructor
public class PageController {

    private final MypageService mypageService;

    /**
     * [메인 페이지] 사용자 정보, 통계, 달력 데이터를 반환합니다.
     * GET /api/page/main
     * (인증된 사용자만 접근 가능)
     */
    @GetMapping("/main")
    public ResponseEntity<MainPageResponse> getMainPageData(Authentication authentication) {
        
        // 1. Spring Security Context에서 인증된 사용자 ID 획득
        PrincipalDetails principalDetails = (PrincipalDetails) authentication.getPrincipal();
        Long userId = principalDetails.getUser().getUserId();
        
        try {
            // 2. 서비스 호출
            MainPageResponse response = mypageService.getMyPageData(userId);
            
            // 3. 성공 응답
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            // 4. 오류 응답 (404 Not Found 또는 400 Bad Request)
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }
}