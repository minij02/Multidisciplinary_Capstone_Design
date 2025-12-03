package com.example.capstone.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "diary_entry") // "일기 항목" -> "diary_entry"
public class DiaryEntry extends BaseTimeEntity { // (생성일/수정일 상속)

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "diary_entry_id") // "일기 항목 아이디" -> "diary_entry_id"
    private Long id;

    @Column(name = "date", nullable = false) // "일기 해당 날짜" -> "date"
    private LocalDate date;

    @Column(name = "subtitle", nullable = false) // "소제목" -> "subtitle"
    private String subtitle;

    @Column(name = "content", columnDefinition = "TEXT", nullable = false) // "일기 본문" -> "content"
    private String content;

    @Column(name = "creation_method", nullable = false) // "생성 방식" -> "creation_method"
    private String creationMethod; // "manual", "chat", "AI_Generated_Chat"

    // '일기 항목'은 '여행 챕터'에 종속됨 (N:1)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_chapter_id", nullable = false) // "챕터 아이디" -> "trip_chapter_id"
    private TripChapter tripChapter;

    // '일기 항목'은 '채팅 기록'을 여러 개 가질 수 있음 (1:N)
    @OneToMany(mappedBy = "diaryEntry", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ChatMessage> chatMessages = new ArrayList<>();

    // '일기 항목'은 '첨부 파일'을 여러 개 가질 수 있음 (1:N)
    @OneToMany(mappedBy = "diaryEntry", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AttachedFile> attachedFiles = new ArrayList<>();
}