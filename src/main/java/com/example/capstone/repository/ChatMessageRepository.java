package com.example.capstone.repository;

import com.example.capstone.domain.ChatMessage;
import com.example.capstone.domain.DiaryEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    /**
     * ★ (핵심 기능) ★
     * DiaryService가 Spring AI 분석을 요청하기 직전에 호출하는 메서드입니다.
     * * 특정 '일기 항목(DiaryEntry)' ID에 묶여있는 모든 채팅 기록(ChatMessage)을
     * (봇과 사용자 메시지 모두) 시간순으로 조회합니다.
     */
    List<ChatMessage> findByDiaryEntry(DiaryEntry diaryEntry);
}