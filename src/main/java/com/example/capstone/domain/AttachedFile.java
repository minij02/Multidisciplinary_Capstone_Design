package com.example.capstone.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "attached_file") // "일기 항목에 첨부된 파일" -> "attached_file"
public class AttachedFile extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "attached_file_id") // "미디어 아이디" -> "attached_file_id"
    private Long id;

    // ★★★ [수정됨] VARCHAR(1000) 대신 TEXT 타입 지정 (Data Truncation 해결) ★★★
    @Column(name = "file_url", columnDefinition = "TEXT", nullable = false) 
    private String fileUrl;

    @Column(name = "media_type", nullable = false) // "미디어 타입" -> "media_type"
    private String mediaType; // "image", "video", "audio" etc.

    // --- 연관관계 매핑 ---

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "diary_entry_id", nullable = false) // "일기 항목 아이디" -> "diary_entry_id"
    private DiaryEntry diaryEntry;
}