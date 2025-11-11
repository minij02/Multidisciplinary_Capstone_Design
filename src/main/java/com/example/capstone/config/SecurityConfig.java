package com.example.capstone.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

// 실제 애플리케이션에서는 WebSecurityConfigurerAdapter를 상속받거나
// SecurityFilterChain 빈을 정의하여 보안 설정을 구성해야 합니다.
@Configuration
public class SecurityConfig {

    /**
     * 비밀번호 인코딩을 위한 BCryptPasswordEncoder 빈을 등록합니다.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        // BCrypt는 Spring Security에서 권장하는 해싱 알고리즘입니다.
        return new BCryptPasswordEncoder();
    }
    
    // ⚠️ 참고: 실제 환경에서는 Spring Security의 전체 설정을 포함해야 합니다.
}