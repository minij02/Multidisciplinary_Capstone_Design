package com.example.capstone.service;

import com.example.capstone.domain.User;
import com.example.capstone.domain.VerificationCode;
import com.example.capstone.dto.LoginRequest;
import com.example.capstone.dto.LoginResponse;
import com.example.capstone.dto.RegisterRequest;
import com.example.capstone.repository.UserRepository;
import com.example.capstone.repository.VerificationCodeRepository;
import com.example.capstone.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final VerificationCodeRepository verificationCodeRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * 회원가입을 처리하고 인증 코드를 발송합니다.
     */
    @Transactional
    public void registerAndSendCode(RegisterRequest request) {
        // 1. 유효성 검사 (비밀번호 일치 확인)
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
        }

        // 2. 이메일 중복 확인
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }

        // 3. 임시 User 객체 생성 및 저장 (실제 서비스에서는 인증 완료 후 저장할 수도 있음)
        User tempUser = new User();

        tempUser.setName(request.getName());
        tempUser.setEmail(request.getEmail());
        tempUser.setPassword(passwordEncoder.encode(request.getPassword()));
        
        userRepository.save(tempUser);
        
        // 4. 인증 코드 생성 및 저장
        String verificationCode = generateVerificationCode();
        saveVerificationCode(request.getEmail(), verificationCode);

        // 5. 인증 이메일 발송
        emailService.sendVerificationCode(request.getEmail(), verificationCode);
        
        System.out.println("인증 코드 발송: " + request.getEmail() + " -> " + verificationCode);
    }
    
    /**
     * 인증 코드를 검증하고 사용자 계정을 활성화합니다.
     */
    @Transactional
    public void verifyAccount(String email, String code) {
        VerificationCode vc = verificationCodeRepository.findByEmailAndCode(email, code)
                .orElseThrow(() -> new IllegalArgumentException("유효하지 않은 인증 코드입니다."));

        // 1. 만료 시간 확인
        if (vc.getExpiryTime().isBefore(LocalDateTime.now())) {
            verificationCodeRepository.delete(vc); // 만료된 코드는 삭제
            throw new IllegalArgumentException("인증 코드가 만료되었습니다. 재발송해주세요.");
        }

        // 2. 인증 완료 상태로 변경
        vc.setVerified(true);

        // 3. User 엔티티의 활성화 상태 변경 (예시)
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("등록되지 않은 사용자입니다."));
        user.setIsActivated(true); 
        userRepository.save(user); // 변경된 상태 DB에 반영
        
        verificationCodeRepository.save(vc); // 상태 저장
    }

    /**
     * 인증 코드를 재발송합니다.
     */
    @Transactional
    public void resendVerificationCode(String email) {
        Optional<User> existingUser = userRepository.findByEmail(email);
        if (existingUser.isEmpty()) {
            throw new IllegalArgumentException("등록된 사용자가 아닙니다.");
        }

        String newCode = generateVerificationCode();
        saveVerificationCode(email, newCode);
        
        emailService.sendVerificationCode(email, newCode);
        System.out.println("인증 코드 재발송: " + email + " -> " + newCode);
    }
    
    // --- 내부 헬퍼 메서드 ---

    private String generateVerificationCode() {
        Random random = new Random();
        int code = 1000 + random.nextInt(9000); // 4자리 숫자
        return String.valueOf(code);
    }

    private void saveVerificationCode(String email, String code) {
        // 기존 코드가 있다면 업데이트, 없다면 새로 생성
        VerificationCode vc = verificationCodeRepository.findByEmail(email)
                .orElseGet(VerificationCode::new);

        vc.setEmail(email);
        vc.setCode(code);
        vc.setExpiryTime(LocalDateTime.now().plusMinutes(5)); // 5분 후 만료
        vc.setVerified(false);
        verificationCodeRepository.save(vc);
    }

     /**
     * 일반 로그인 처리
     */
    public LoginResponse login(LoginRequest request) {
        // 1. 이메일로 사용자 찾기
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("가입되지 않은 이메일입니다."));

        // 2. 계정이 활성화되지 않았을 경우
        if (!user.getIsActivated()) {
            throw new IllegalArgumentException("이메일 인증이 완료되지 않은 계정입니다.");
        }

        // 3. 비밀번호 검증
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }

        // 4. JWT 토큰 생성
        String token = jwtTokenProvider.generateToken(user.getUserId());

        // 5. 응답 객체 반환
        return new LoginResponse(token, "Bearer", user.getUserId());
    }
}