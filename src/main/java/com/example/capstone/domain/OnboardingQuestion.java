package com.example.capstone.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "onboarding_question")
public class OnboardingQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "onboarding_id")
    private Long onboardingId;

    // N:1 관계: 사용자 (Foreign Key)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Q1: 여행 시작 날짜 (Onboarding -1)
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    // Q2: 여행 스타일 (Onboarding -2)
    @Column(name = "travel_style", nullable = false, length = 50)
    private String travelStyle; 

    // Q3: 여행 테마 (Onboarding -3)
    @Column(name = "travel_theme", nullable = false, length = 255)
    private String travelTheme;

    // Q4: 여행 제목 (Onboarding -4)
    @Column(name = "travel_title", nullable = false, length = 255)
    private String travelTitle;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt; // 생성 일시

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt; // 수정 일시
}