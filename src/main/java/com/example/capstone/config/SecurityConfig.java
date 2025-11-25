package com.example.capstone.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
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
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

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
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            
            // 세션 기반 폼 로그인을 비활성화하여 기본 로그인 페이지로 리다이렉트 되는 것을 방지
            .formLogin(form -> form.disable())

            // 세션 관리 상태를 Stateless(무상태)로 설정 (JWT 사용 시 필수)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // JWT 인증 필터 등록
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
        
            // 1. 요청별 인가 규칙 설정
           .authorizeHttpRequests(auth -> auth
    .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
    .requestMatchers("/api/auth/register").permitAll()
    .requestMatchers("/api/auth/login").permitAll()
    .requestMatchers("/api/auth/verify").permitAll()
    .requestMatchers("/api/auth/resend-code").permitAll()
    .requestMatchers("/api/auth/**", "/login/**", "/oauth2/**").permitAll()
    .requestMatchers("/api/mypage/**").authenticated()
    .anyRequest().authenticated()
)
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
     * CORS 설정
     * 프론트엔드(http://localhost:3000)로부터의 접근을 허용합니다.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // 프론트엔드 출처(Origin) 허용
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000", "http://127.0.0.1:3000"));
        
        // 허용할 HTTP 메서드 및 헤더, 인증 정보 설정
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With"));
        configuration.setAllowCredentials(true); // 쿠키/인증 정보 (JWT 사용 시 필요) 허용
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration); // 모든 경로에 CORS 설정 적용
        return source;
    }

    /**
     * 비밀번호 인코딩을 위한 BCryptPasswordEncoder 빈을 등록합니다.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        
        return new BCryptPasswordEncoder();
    }
    
}