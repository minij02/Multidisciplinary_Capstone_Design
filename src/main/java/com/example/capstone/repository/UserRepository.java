package com.example.capstone.repository;

import com.example.capstone.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    
    /**
     * 이메일을 통해 사용자 정보를 조회합니다.
     * 회원가입 시 중복 확인 및 로그인 시 사용자 인증에 사용됩니다.
     * * @param email 조회할 사용자 이메일
     * @return User 엔티티를 포함하는 Optional 객체
     */
    Optional<User> findByEmail(String email);
}