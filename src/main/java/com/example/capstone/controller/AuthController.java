package com.example.capstone.controller;

import com.example.capstone.dto.RegisterRequest;
import com.example.capstone.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * [Register Step] 회원가입 요청 및 인증 코드 발송
     * POST /api/auth/register
     */
    @PostMapping("/register")
    public ResponseEntity<String> register(@Valid @RequestBody RegisterRequest request) {
        try {
            authService.registerAndSendCode(request);
            // 성공 시, 클라이언트에게 인증 코드가 발송되었음을 알림
            return new ResponseEntity<>("회원가입 요청 성공. 이메일로 발송된 인증 코드를 확인하세요.", HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    /**
     * [Verify Account Step] 인증 코드 확인
     * POST /api/auth/verify
     */
    @PostMapping("/verify")
    public ResponseEntity<String> verifyAccount(@RequestParam String email, @RequestParam String code) {
        try {
            authService.verifyAccount(email, code);
            return new ResponseEntity<>("계정 인증이 완료되었습니다.", HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    /**
     * [Verify Account Step] 인증 코드 재발송
     * POST /api/auth/resend-code
     */
    @PostMapping("/resend-code")
    public ResponseEntity<String> resendCode(@RequestParam String email) {
        try {
            authService.resendVerificationCode(email);
            return new ResponseEntity<>("인증 코드가 재발송되었습니다.", HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }
}