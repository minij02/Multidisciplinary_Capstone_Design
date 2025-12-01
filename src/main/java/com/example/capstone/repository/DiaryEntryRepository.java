package com.example.capstone.repository;

import com.example.capstone.domain.DiaryEntry;
import com.example.capstone.domain.TripChapter;
import com.example.capstone.dto.DiaryDateResponse;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DiaryEntryRepository extends JpaRepository<DiaryEntry, Long> {
    // (기존) 특정 챕터에 속한 모든 일기 항목 찾기
    List<DiaryEntry> findByTripChapter(TripChapter tripChapter);

    /**
     * 통합 및 수정됨:
     * 특정 사용자 ID와 Entry ID를 기준으로 일기 항목과 첨부 파일(attachedFiles)을 조회합니다.
     * 대상 엔티티: DailyEntry -> DiaryEntry
     * 필드 변경: chapter -> tripChapter, media -> attachedFiles
     */
    @Query("SELECT de FROM DiaryEntry de " +
            "JOIN FETCH de.tripChapter tc " +        // tripChapter 정보 함께 로드
            "LEFT JOIN FETCH de.attachedFiles af " + // attachedFiles 정보 함께 로드
            "WHERE de.id = :entryId AND tc.user.userId = :userId")
    Optional<DiaryEntry> findByIdAndUserId(@Param("entryId") Long entryId, @Param("userId") Long userId);
    
    /**
     * (수정됨) 특정 사용자의 일기 ID와 날짜를 함께 조회 (달력 매핑용)
     * 반환 타입: List<LocalDate> -> List<DiaryDateDto>
     */
    @Query("SELECT new com.example.capstone.dto.DiaryDateResponse(de.id, de.date) " +
           "FROM DiaryEntry de " +
           "JOIN de.tripChapter tc " +
           "WHERE tc.user.userId = :userId")
    List<DiaryDateResponse> findDiaryListByUserId(@Param("userId") Long userId);

    /**
     * DailyEntryRepository에서 이동됨:
     * 특정 사용자가 작성한 총 일기 수를 세는 메서드
     * 필드 변경: chapter -> tripChapter
     */
    @Query("SELECT COUNT(de) FROM DiaryEntry de " +
           "JOIN de.tripChapter tc " +
           "WHERE tc.user.userId = :userId")
    Long countAllByUserId(@Param("userId") Long userId);
}