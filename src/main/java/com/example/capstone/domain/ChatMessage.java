package com.example.capstone.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter // Service에서 DTO를 Entity로 변환할 때 편리합니다.
@NoArgsConstructor
@Table(name = "채팅 기록") // DDL의 '채팅 기록' 테이블과 매핑
public class ChatMessage extends BaseTimeEntity { // '생성일', '수정일' 자동 관리를 상속받음

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "채팅 아이디")
    private Long id;

    @Column(name = "메시지 발신자", nullable = false)
    private String sender; // "user" 또는 "bot"

    @Column(name = "메시지 내용", columnDefinition = "TEXT", nullable = false)
    private String message;

    // --- 연관관계 매핑 ---

    // '채팅 기록'은 '사용자'에게 종속됨 (N:1)
    @ManyToOne(fetch = FetchType.LAZY) // LAZY: 실제 User 객체가 필요할 때만 DB에서 조회
    @JoinColumn(name = "사용자 아이디", nullable = false) // DDL의 '사용자 아이디' (FK)
    private User user;

    // '채팅 기록'은 '일기 항목'에 종속됨 (N:1)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "일기 항목 아이디", nullable = false) // DDL의 '일기 항목 아이디' (FK)
    private DiaryEntry diaryEntry;
}