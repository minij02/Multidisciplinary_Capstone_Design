package com.example.capstone.repository;

import com.example.capstone.domain.DailyEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface DailyEntryRepository extends JpaRepository<DailyEntry, Long> {

    // 특정 사용자의 모든 일기 작성 날짜를 조회하는 쿼리 (달력용)
    @Query("SELECT de.entryDate FROM DailyEntry de JOIN de.chapter tc WHERE tc.user.userId = :userId")
    List<LocalDate> findDiaryDatesByUserId(@Param("userId") Long userId);
    
    // 특정 사용자가 작성한 총 일기 수를 세는 메서드
    @Query("SELECT COUNT(de) FROM DailyEntry de JOIN de.chapter tc WHERE tc.user.userId = :userId")
    Long countAllByUserId(@Param("userId") Long userId);
}