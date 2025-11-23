package com.example.capstone.controller;

import com.example.capstone.domain.DiaryEntry;
import com.example.capstone.domain.TripChapter;
import com.example.capstone.dto.ChatMessageRequest;
import com.example.capstone.dto.DiaryCreateRequest;
import com.example.capstone.service.DiaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/diary") // (CORS 설정에서 /api/**를 허용해야 함)
public class DiaryController {

    private final DiaryService diaryService;

    /**
     * 1. 일기 작성 (DiaryWrite.tsx -> "음성으로 작성하기" 버튼 클릭 시)
     * (이 API는 챕터와 빈 일기 항목을 먼저 생성하고, 생성된 '일기 항목 ID'를 반환)
     */
    @PostMapping("/chapter")
    public ResponseEntity<?> createDiaryChapter(@RequestBody DiaryCreateRequest dto) {
        log.info("일기 챕터 생성 요청 받음: {}", dto);
        try {
            DiaryEntry createdEntry = diaryService.createDiaryChapterAndEntry(dto);
            // (간단하게, 생성된 챕터의 첫 번째 일기 항목 ID를 반환한다고 가정)
            Long diaryEntryId = createdEntry.getId();
            log.info("일기 챕터 생성 성공: diaryEntryId={}", diaryEntryId);

            return ResponseEntity.status(HttpStatus.CREATED).body(diaryEntryId);
        } catch (RuntimeException e) {
            log.error("일기 챕터 생성 실패 (RuntimeException): {}", e.getMessage(), e);
            // RuntimeException을 400 Bad Request로 변환
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage() != null ? e.getMessage() : "일기 생성 중 오류가 발생했습니다."));
        } catch (Exception e) {
            log.error("일기 챕터 생성 실패 (Exception): {}", e.getMessage(), e);
            // 기타 예외는 500 Internal Server Error
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "서버 오류가 발생했습니다: " + e.getMessage()));
        }
    }

    /**
     * 2. 채팅 메시지 저장 (InterviewChat.tsx -> [✓] 또는 [▶] 버튼 클릭 시)
     */
    @PostMapping("/entry/{diaryEntryId}/chat")
    public ResponseEntity<Void> addChatMessage(
            @PathVariable Long diaryEntryId,
            @RequestBody ChatMessageRequest dto
    ) {
        diaryService.saveChatMessage(diaryEntryId, dto);
        return ResponseEntity.ok().build();
    }

    /**
     * 3. AI 분석 및 저장 (InterviewChat.tsx -> "편집 완료" 팝업에서 [편집완료] 클릭 시)
     */
    @PostMapping("/entry/{diaryEntryId}/analyze")
    public ResponseEntity<?> analyzeAndCompleteDiary(@PathVariable Long diaryEntryId) {
        log.info("AI 분석 요청 받음: diaryEntryId={}", diaryEntryId);
        try {
            DiaryEntry updatedEntry = diaryService.analyzeAndSaveDiaryContent(diaryEntryId);
            log.info("AI 분석 완료: diaryEntryId={}", diaryEntryId);
            return ResponseEntity.ok(updatedEntry);
        } catch (RuntimeException e) {
            log.error("AI 분석 실패 (RuntimeException): diaryEntryId={}, error={}", diaryEntryId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage() != null ? e.getMessage() : "AI 분석 중 오류가 발생했습니다."));
        } catch (Exception e) {
            log.error("AI 분석 실패 (Exception): diaryEntryId={}, error={}", diaryEntryId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "AI 분석 중 서버 오류가 발생했습니다: " + e.getMessage()));
        }
    }
}