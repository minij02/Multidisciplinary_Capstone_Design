package com.example.capstone.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "entry_media")
public class EntryMedia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "media_id")
    private Long mediaId;

    // N:1 관계: 세부 일기 항목
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entry_id", nullable = false)
    private DailyEntry entry;

    @Column(name = "file_url", nullable = false, length = 512)
    private String fileUrl; // 파일 저장 경로 URL

    @Enumerated(EnumType.STRING)
    @Column(name = "media_type", nullable = false, length = 20)
    private MediaType mediaType; // 미디어 타입 (ENUM)

    @CreationTimestamp
    @Column(name = "uploaded_at", nullable = false)
    private LocalDateTime uploadedAt; // 업로드 일시

    // 미디어 타입 ENUM 정의
    public enum MediaType {
        IMAGE, VOICE_CLIP
    }
}