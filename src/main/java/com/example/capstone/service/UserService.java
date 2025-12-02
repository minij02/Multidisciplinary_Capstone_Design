package com.example.capstone.service;

import com.example.capstone.domain.User;
import com.example.capstone.dto.MyPageResponse;
import com.example.capstone.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    /**
     * 마이페이지 정보 조회
     * Note: 인증(Authentication) 처리는 Controller 계층에서 수행하고,
     * 여기서는 검증된 userId를 받아 비즈니스 로직만 처리합니다.
     */
    @Transactional(readOnly = true)
    public MyPageResponse getMyPageInfo(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        return MyPageResponse.builder()
                .name(user.getName())
                .email(user.getEmail())
                // LocalDateTime -> LocalDate 변환
                .joinDate(user.getCreatedAt().toLocalDate())
                .build();
    }

    /**
     * 회원 탈퇴
     * Note: Controller에서 이미 인증된 사용자 ID를 넘겨주므로,
     * 별도의 본인 확인 로직 없이 해당 ID의 유저를 삭제합니다.
     */
    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        
        // 연관된 데이터(일기, 챕터 등)는 CascadeType.ALL 설정에 의해 자동 삭제됨
        userRepository.delete(user);
    }
}