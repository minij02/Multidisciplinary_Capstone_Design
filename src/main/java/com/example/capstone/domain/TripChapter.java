package com.example.capstone.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "여행 챕터")
public class TripChapter extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "챕터 아이디")
    private Long id;

    @Column(name = "챕터 제목", nullable = false)
    private String title;

    @Column(name = "챕터 대표 이미지", length = 1000)
    private String coverImageUrl;

    @Column(name = "여행 시작일")
    private LocalDate startDate;

    @Column(name = "여행 종료일")
    private LocalDate endDate;

    // ★ 1. (신규) 4개 필드 추가 ★
    @Column(name = "출발 장소")
    private String departureCity;

    @Column(name = "도착 장소")
    private String arrivalCity;

    @Column(name = "여행 N박")
    private Integer tripNights; // "3" (박)

    @Column(name = "여행 N일")
    private Integer tripDays;   // "4" (일)

    // --- (이하 동일) ---
    @Column(name = "출판 완료 여부", nullable = false)
    private Boolean isPublished = false;

    @Column(name = "총 경비", precision = 10, scale = 2)
    private BigDecimal totalCost;

    @Column(name = "`Key`", nullable = false) // (이전 수정 사항 반영됨)
    private String key;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "사용자 아이디", nullable = false)
    private User user;

    @OneToMany(mappedBy = "tripChapter", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DiaryEntry> diaryEntries = new ArrayList<>();

    // (연관관계 편의 메서드)
    public void addDiaryEntry(DiaryEntry entry) {
        this.diaryEntries.add(entry);
        entry.setTripChapter(this);
    }
}