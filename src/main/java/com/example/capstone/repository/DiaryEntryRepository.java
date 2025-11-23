package com.example.capstone.repository;

import com.example.capstone.domain.DiaryEntry;
import com.example.capstone.domain.TripChapter;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DiaryEntryRepository extends JpaRepository<DiaryEntry, Long> {
    // (필요시) 특정 챕터에 속한 모든 일기 항목 찾기
    List<DiaryEntry> findByTripChapter(TripChapter tripChapter);
}