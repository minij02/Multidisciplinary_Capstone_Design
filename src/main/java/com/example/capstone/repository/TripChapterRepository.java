package com.example.capstone.repository;

import com.example.capstone.domain.TripChapter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TripChapterRepository extends JpaRepository<TripChapter, Long> {

    /**
     * 특정 사용자의 모든 챕터와 해당 챕터의 세부 일기 항목을 조회합니다.
     * Fetch Join을 사용하여 N+1 쿼리 문제를 방지합니다.
     *
     * @param userId 현재 로그인한 사용자 ID
     * @return 챕터 엔티티 리스트 (TripChapter)
     */
    @Query("SELECT DISTINCT tc FROM TripChapter tc " +
           "LEFT JOIN FETCH tc.diaryEntries de " + // TripChapter의 필드명 'diaryEntries' 사용
           "WHERE tc.user.userId = :userId " +
           "ORDER BY tc.createdAt ASC, de.createdAt DESC") 
    List<TripChapter> findAllWithEntriesByUserId(@Param("userId") Long userId);
}