package com.example.capstone.repository;

import com.example.capstone.domain.VerificationCode;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface VerificationCodeRepository extends JpaRepository<VerificationCode, Long> {
    Optional<VerificationCode> findByEmail(String email);
    Optional<VerificationCode> findByEmailAndCode(String email, String code);
}