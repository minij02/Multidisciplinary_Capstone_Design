package com.example.capstone.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import com.example.capstone.service.CustomOAuth2UserService;
import com.example.capstone.security.OAuth2SuccessHandler;

import lombok.RequiredArgsConstructor;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    
    private final CustomOAuth2UserService customOAuth2UserService;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;

    /**
     * Spring Security 필터 체인을 설정합니다.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // CORS 및 CSRF 설정 비활성화 (API 개발 시 일반적으로 수행)
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.disable())
            
            // 1. 요청별 인가 규칙 설정
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**", "/login/**", "/oauth2/**").permitAll() // 인증/로그인 관련 경로는 모두 허용
                .anyRequest().authenticated() // 나머지 요청은 인증 필요
            )
            
            // 2. OAuth 2.0 로그인 설정
             .oauth2Login(oauth2 -> oauth2
                .loginPage("/login")
                .userInfoEndpoint(userInfo -> userInfo
                    .userService(customOAuth2UserService)
                )
                .successHandler(oAuth2SuccessHandler) // 로그인 성공 시 JWT 발급 및 리디렉션
            );
            
        return http.build();
    }

    /**
     * 비밀번호 인코딩을 위한 BCryptPasswordEncoder 빈을 등록합니다.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        
        return new BCryptPasswordEncoder();
    }
    
}