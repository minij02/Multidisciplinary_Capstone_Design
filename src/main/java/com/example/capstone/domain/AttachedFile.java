package com.example.capstone.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter // Service에서 DTO를 Entity로 변환할 때 편리합니다.
@NoArgsConstructor
@Table(name = "일기 항목에 첨부된 파일") // DDL의 테이블 이름과 매핑
public class AttachedFile extends BaseTimeEntity { // '생성일', '수정일' 자동 관리를 상속받음

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "미디어 아이디")
    private Long id;

    @Column(name = "파일 저장 경로 URL", length = 1000, nullable = false)
    private String fileUrl; // S3 등에 저장된 실제 파일 경로

    @Column(name = "미디어 타입", nullable = false)
    private String mediaType; // "image", "video", "audio" 등

    // --- 연관관계 매핑 ---

    // '첨부 파일'은 '일기 항목'에 종속됨 (N:1)
    @ManyToOne(fetch = FetchType.LAZY) // LAZY: 실제 DiaryEntry 객체가 필요할 때만 DB에서 조회
    @JoinColumn(name = "일기 항목 아이디", nullable = false) // DDL의 '일기 항목 아이디' (FK)
    private DiaryEntry diaryEntry;
}