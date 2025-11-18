package com.example.capstone.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;

import com.example.capstone.service.CustomOAuth2UserService;
import com.example.capstone.security.JwtAuthenticationFilter;
import com.example.capstone.security.OAuth2SuccessHandler;

import lombok.RequiredArgsConstructor;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
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
            
            // JWT 인증 필터 등록
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)

            // 세션 관리 상태를 Stateless(무상태)로 설정 (JWT 사용 시 필수)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // 세션 기반 폼 로그인을 비활성화하여 기본 로그인 페이지로 리다이렉트 되는 것을 방지
            .formLogin(form -> form.disable())
        
            .exceptionHandling(exceptions -> exceptions
                // 인증되지 않은 접근 시 401 Unauthorized 응답
                .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
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