package com.example.capstone.controller;

import com.example.capstone.security.PrincipalDetails;
import com.example.capstone.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.example.capstone.dto.MyPageResponse;

@RestController
@RequestMapping("/api/mypage")
@RequiredArgsConstructor
public class MyPageController {

    private final UserService userService;

    /**
     * 마이페이지 정보 조회
     * GET /api/mypage
     */
    @GetMapping
    public ResponseEntity<MyPageResponse> getMyPageInfo(Authentication authentication) {
        PrincipalDetails principal = (PrincipalDetails) authentication.getPrincipal();
        Long userId = principal.getUser().getUserId();

        MyPageResponse response = userService.getMyPageInfo(userId);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    /**
     * 회원 탈퇴
     * DELETE /api/mypage
     */
    @DeleteMapping
    public ResponseEntity<String> withdrawUser(Authentication authentication) {
        PrincipalDetails principal = (PrincipalDetails) authentication.getPrincipal();
        Long userId = principal.getUser().getUserId();

        userService.deleteUser(userId);
        return new ResponseEntity<>("회원 탈퇴가 완료되었습니다.", HttpStatus.OK);
    }
}