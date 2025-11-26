package com.example.capstone.repository;

import com.example.capstone.domain.ChatMessage;
import com.example.capstone.domain.DailyEntry; // DailyEntry 사용
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    /**
     * 특정 '일기 항목(DailyEntry)'에 묶여있는 모든 채팅 기록을 조회합니다.
     * 필드명 'diaryEntry'에 대한 쿼리입니다.
     */
    // 💡 DiaryService에서 호출: chatMessageRepository.findByDiaryEntry(entry);
    List<ChatMessage> findByDiaryEntry(DailyEntry diaryEntry);
}