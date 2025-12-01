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
@Table(name = "trip_chapter")
public class TripChapter extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "trip_chapter_id")
    private Long id;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "cover_image_url", length = 1000)
    private String coverImageUrl;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "departure_city")
    private String departureCity;

    @Column(name = "arrival_city")
    private String arrivalCity;

    @Column(name = "trip_nights")
    private Integer tripNights;

    @Column(name = "trip_days")
    private Integer tripDays;

    @Column(name = "is_published", nullable = false)
    private Boolean isPublished = false;

    @Column(name = "total_cost", precision = 10, scale = 2)
    private BigDecimal totalCost;

    @Column(name = "`key`", nullable = false)
    private String key;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // ★ [추가됨] 1:1 관계 매핑 필드 ★
    // DB의 'trip_chapter' 테이블에 'onboarding_id' 컬럼이 생성됩니다.
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "onboarding_id") 
    private OnboardingQuestion onboardingQuestion;

    @OneToMany(mappedBy = "tripChapter", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DiaryEntry> diaryEntries = new ArrayList<>();

    // --- 편의 메서드 ---

    // 1. 일기 추가 편의 메서드
    public void addDiaryEntry(DiaryEntry entry) {
        this.diaryEntries.add(entry);
        entry.setTripChapter(this);
    }

    // 2. [추가됨] 온보딩 질문 설정 편의 메서드
    // 서비스 계층에서 newChapter.setOnboardingQuestion(onboard) 형태로 호출하여 관계를 맺습니다.
    public void setOnboardingQuestion(OnboardingQuestion onboardingQuestion) {
        this.onboardingQuestion = onboardingQuestion;
    }
}