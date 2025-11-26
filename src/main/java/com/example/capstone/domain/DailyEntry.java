package com.example.capstone.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "daily_entry")
public class DailyEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "entry_id")
    private Long entryId;

    // N:1 관계: 여행 챕터
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chapter_id", nullable = false)
    private TravelChapter chapter;

    @Column(name = "entry_date", nullable = false)
    private LocalDate entryDate; // 일기 해당 날짜

    @Column(length = 255)
    private String subtitle; // 소제목

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content; // 일기 본문

    @Enumerated(EnumType.STRING)
    @Column(name = "created_method", nullable = false, length = 20)
    private CreatedMethod createdMethod; // 생성 방식 (ENUM)

    @Column(name = "ai_model_version", length = 50)
    private String aiModelVersion; // 사용된 AI 모델 버전

    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt; // 작성/생성 일시

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt; // 수정 일시

    // 1:N 관계: 첨부 미디어 (양방향)
    @OneToMany(mappedBy = "entry", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<EntryMedia> media = new ArrayList<>();

    // 1:N 관계: 채팅 기록 (양방향)
    @OneToMany(mappedBy = "entry", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ChatHistory> chatHistories = new ArrayList<>();

    // 생성 방식 ENUM 정의
    public enum CreatedMethod {
        TEXT, VOICE_CHAT, AI_GENERATED_CHAT
    }
}