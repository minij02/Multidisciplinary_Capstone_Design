package com.example.capstone.repository;

import com.example.capstone.domain.OnboardingQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OnboardingQuestionRepository extends JpaRepository<OnboardingQuestion, Long> {
}