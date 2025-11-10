package com.example.capstone.service;

import com.example.capstone.domain.User;
import com.example.capstone.repository.UserRepository;
import com.example.capstone.security.PrincipalDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;
    
    /**
     * Google 인증이 완료된 후 사용자 정보를 로드하고 처리합니다.
     */
    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        // 1. Google로부터 받아온 기본 OAuth2User 정보 로드
        OAuth2User oAuth2User = super.loadUser(userRequest);
        
        // 2. Google 사용자 정보 추출
        Map<String, Object> attributes = oAuth2User.getAttributes();
        String email = (String) attributes.get("email");
        String name = (String) attributes.get("name");
        
        // 3. 사용자 정보 DB 처리 (회원가입 또는 업데이트)
        User user = userRepository.findByEmail(email)
                .map(entity -> updateExistingUser(entity, name)) // 이미 존재하면 이름 업데이트
                .orElseGet(() -> registerNewUser(email, name)); // 존재하지 않으면 새로 등록

        // 4. Spring Security가 인증 정보를 유지하도록 PrincipalDetails 객체를 반환
        return new PrincipalDetails(user, oAuth2User.getAttributes());
    }

    /**
     * 새로운 소셜 로그인 사용자를 DB에 등록합니다.
     */
    private User registerNewUser(String email, String name) {
        User newUser = new User();
        newUser.setEmail(email);
        newUser.setName(name);
        
        // 소셜 로그인 사용자의 비밀번호는 임의의 해시값으로 설정합니다. (직접 로그인 방지)
        newUser.setPassword(UUID.randomUUID().toString()); 
        
        // 소셜 로그인은 기본적으로 인증이 완료된 것으로 간주합니다.
        newUser.setIsActivated(true); 
        
        return userRepository.save(newUser);
    }

    /**
     * 기존 소셜 로그인 사용자의 정보를 업데이트합니다.
     */
    private User updateExistingUser(User existingUser, String name) {
        // Google에서 이름이 변경되었을 경우 업데이트
        existingUser.setName(name);
        
        return userRepository.save(existingUser);
    }
}