package com.example.capstone.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    
    // application.properties에서 설정된 spring.mail.username 값을 주입
    @Value("${spring.mail.username}")
    private String fromAddress; 
    
    /**
     * 인증 코드를 포함한 이메일을 발송합니다.
     * @param to 이메일 수신 주소
     * @param code 발송할 4자리 인증 코드
     */
    public void sendVerificationCode(String to, String code) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            
            // HTML 콘텐츠를 허용 (true), 인코딩은 UTF-8
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress); // @Value로 주입받은 발신자 주소 사용
            helper.setTo(to);
            helper.setSubject("[TripDairy] 회원가입 인증 코드입니다.");
            
            // 내용 설정 (HTML 형식)
            String content = "<h1>TripDairy 계정 인증</h1>"
                           + "<p>다음 인증 코드를 회원가입 페이지에 입력하여 이메일 인증을 완료해 주세요.</p>"
                           + "<div style='font-size:24px; color:blue; font-weight:bold;'>" + code + "</div>"
                           + "<p>본 코드는 5분간 유효합니다.</p>";
                           
            helper.setText(content, true); // HTML 내용임을 명시

            mailSender.send(message);
            
            System.out.println("이메일 발송 성공: " + to + " - Code: " + code);

        } catch (MessagingException e) {
            System.err.println("이메일 발송 실패: " + e.getMessage());
            // RuntimeException을 던져 트랜잭션 롤백을 유도
            throw new RuntimeException("이메일 발송 중 오류가 발생했습니다.", e);
        }
    }
}