package com.example.capstone.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "chat_message") // "채팅 기록" -> "chat_message"
public class ChatMessage extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "chat_message_id") // "채팅 아이디" -> "chat_message_id"
    private Long id;

    @Column(name = "sender", nullable = false) // "메시지 발신자" -> "sender"
    private String sender; // "user" 또는 "bot"

    @Column(name = "message", columnDefinition = "TEXT", nullable = false) // "메시지 내용" -> "message"
    private String message;

    // --- 연관관계 매핑 ---

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false) // "사용자 아이디" -> "user_id"
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "diary_entry_id", nullable = false) // "일기 항목 아이디" -> "diary_entry_id"
    private DiaryEntry diaryEntry;
}