package com.example.capstone.security;

import com.example.capstone.domain.User;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication)
            throws IOException, ServletException {

        // 로그인된 사용자 정보 꺼내기
        PrincipalDetails principal = (PrincipalDetails) authentication.getPrincipal();
        User user = principal.getUser();

        // JWT 발급
        String token = jwtTokenProvider.generateToken(user.getUserId());

        // 프론트엔드로 리디렉션 (토큰 포함)
        String redirectUri = "http://localhost:3000/oauth-success?token=" + token;
        response.sendRedirect(redirectUri);
    }
}