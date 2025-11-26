package com.example.capstone.repository;

import com.example.capstone.domain.DailyEntry;
import com.example.capstone.domain.DiaryEntry;
import com.example.capstone.domain.TripChapter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DiaryEntryRepository extends JpaRepository<DiaryEntry, Long> {
    // (필요시) 특정 챕터에 속한 모든 일기 항목 찾기
    List<DiaryEntry> findByTripChapter(TripChapter tripChapter);

     /**
     * 특정 사용자 ID와 Entry ID를 기준으로 일기 항목과 첨부된 미디어를 조회합니다.
     * Fetch Join을 사용하여 N+1 문제를 방지하고, 인가(Authorization)를 동시에 수행합니다.
     * @param entryId 일기 항목 ID
     * @param userId 현재 로그인한 사용자 ID (인가용)
     * @return DailyEntry 엔티티 (Optional)
     */
    @Query("SELECT de FROM DailyEntry de " +
           "JOIN FETCH de.chapter tc " + // Chapter 정보도 함께 로드
           "LEFT JOIN FETCH de.media em " + // 미디어 정보도 함께 로드 (만약 DailyEntry에 'media' 필드가 있다면)
           "WHERE de.id = :entryId AND tc.user.userId = :userId")
    Optional<DailyEntry> findByIdAndUserId(@Param("entryId") Long entryId, @Param("userId") Long userId);
}