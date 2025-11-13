package com.example.capstone.security;

import com.example.capstone.domain.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;

public class PrincipalDetails implements UserDetails, OAuth2User {

    private final User user;
    private final Map<String, Object> attributes;
    
    // 일반 로그인 (UserDetails)
    public PrincipalDetails(User user) {
        this.user = user;
        this.attributes = null;
    }
    
    // 소셜 로그인 (OAuth2User)
    public PrincipalDetails(User user, Map<String, Object> attributes) {
        this.user = user;
        this.attributes = attributes;
    }

    public User getUser() {
        return this.user;
    }

    // --- UserDetails 구현 (일반 로그인 시 사용) ---

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // 권한 설정: 여기서는 간단히 "ROLE_USER" 권한을 부여합니다.
        return Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"));
    }

    @Override
    public String getPassword() {
        return user.getPassword();
    }

    @Override
    public String getUsername() {
        return user.getEmail(); // Spring Security는 'username' 필드를 이메일로 사용
    }
    
    // 기타 계정 상태 (활성화/만료/잠금 등)
    @Override
    public boolean isAccountNonExpired() { return true; }
    @Override
    public boolean isAccountNonLocked() { return true; }
    @Override
    public boolean isCredentialsNonExpired() { return true; }
    @Override
    public boolean isEnabled() { return user.getIsActivated(); } // 활성화 상태 사용

    // --- OAuth2User 구현 (소셜 로그인 시 사용) ---

    @Override
    public Map<String, Object> getAttributes() {
        return attributes;
    }

    @Override
    public String getName() {
        // Google은 email을 반환하므로 email을 사용합니다.
        return user.getEmail(); 
    }
}