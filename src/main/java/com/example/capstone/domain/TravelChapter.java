package com.example.capstone.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "travel_chapter")
public class TravelChapter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "chapter_id")
    private Long chapterId;

    // N:1 관계: 사용자
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 255)
    private String title; // 챕터 제목

    @Column(name = "cover_image_url", length = 512)
    private String coverImageUrl; // 챕터 대표 이미지 URL

    @Column(name = "start_date")
    private LocalDate startDate; // 여행 시작일 (DATE 타입)

    @Column(name = "end_date")
    private LocalDate endDate; // 여행 종료일 (DATE 타입)

    @Column(name = "is_published", nullable = false)
    private Boolean isPublished = false; // 출판(생성) 완료 여부

    @Column(name = "total_cost", precision = 10, scale = 2)
    private BigDecimal totalCost = BigDecimal.ZERO; // 총 경비

    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt; // 생성 일시

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt; // 수정 일시

    // 1:N 관계: 세부 일기 항목 (양방향)
    @OneToMany(mappedBy = "chapter", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DailyEntry> entries = new ArrayList<>();
}