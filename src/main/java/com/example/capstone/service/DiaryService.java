package com.example.capstone.service;

import com.example.capstone.domain.*; // 모든 Entity import
import com.example.capstone.dto.ChatMessageRequest;
import com.example.capstone.dto.DiaryCreateRequest;
import com.example.capstone.dto.DiaryDetailResponse;
import com.example.capstone.repository.*; // 모든 Repository import
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.UUID;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional(readOnly = true)
public class DiaryService {

    private final TripChapterRepository tripChapterRepository;
    private final DiaryEntryRepository diaryEntryRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;

    private final WebClient webClient;
    private final String model;

    public DiaryService(
            TripChapterRepository tripChapterRepository, DiaryEntryRepository diaryEntryRepository, ChatMessageRepository chatMessageRepository, UserRepository userRepository, @Value("${spring.ai.openai.chat.base-url}") String apiUrl,
            @Value("${spring.ai.openai.api-key}") String apiKey,
            @Value("${spring.ai.openai.chat.options.model}") String model) {
        this.tripChapterRepository = tripChapterRepository;
        this.diaryEntryRepository = diaryEntryRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.userRepository = userRepository;
        this.model = model;
        this.webClient = WebClient.builder()
                .baseUrl(apiUrl)
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .build();
    }

    private User getDummyUser() {
        // 1번 SQL 스크립트로 생성한 ID=1인 가라 유저를 찾습니다.
        return userRepository.findById(1L)
                .orElseThrow(() -> new RuntimeException("DB에 ID=1인 가라 유저(dummy user)가 없습니다."));
    }

    /**
     * 프론트엔드(DiaryWrite.tsx)에서 일기 기본 정보(챕터)를 생성합니다.
     * (이 단계에서는 '일기 본문'이 비어있거나, 수동 입력한 내용이 들어옵니다)
     */
    @Transactional
    public DiaryEntry createDiaryChapterAndEntry(DiaryCreateRequest dto) {
        log.info("createDiaryChapterAndEntry 호출됨: diaryTitle={}, startDate={}, endDate={}", 
                dto.getDiaryTitle(), dto.getStartDate(), dto.getEndDate());
        
        // 유효성 검사
        if (dto.getDiaryTitle() == null || dto.getDiaryTitle().trim().isEmpty()) {
            log.error("일기 제목이 비어있음");
            throw new RuntimeException("일기 제목은 필수입니다.");
        }
        if (dto.getStartDate() == null) {
            log.error("여행 시작일이 null");
            throw new RuntimeException("여행 시작일은 필수입니다.");
        }
        if (dto.getEndDate() == null) {
            log.error("여행 종료일이 null");
            throw new RuntimeException("여행 종료일은 필수입니다.");
        }
        if (dto.getStartDate().isAfter(dto.getEndDate())) {
            log.error("여행 시작일이 종료일보다 늦음: startDate={}, endDate={}", dto.getStartDate(), dto.getEndDate());
            throw new RuntimeException("여행 시작일은 종료일보다 이전이어야 합니다.");
        }

        // (실제로는 SecurityContext에서 User를 가져와야 합니다)
        log.info("더미 유저 조회 시작");
        User dummyUser = getDummyUser();

        // 1. 여행 챕터 생성 (프론트에서 받은 정보)
        TripChapter chapter = new TripChapter();
        chapter.setTitle(dto.getDiaryTitle());
        chapter.setStartDate(dto.getStartDate());
        chapter.setEndDate(dto.getEndDate());
        chapter.setDepartureCity(dto.getDepartureCity());
        chapter.setArrivalCity(dto.getArrivalCity());
        chapter.setTripNights(dto.getTripNights() != null ? dto.getTripNights() : 0);
        chapter.setTripDays(dto.getTripDays() != null ? dto.getTripDays() : 1);
        chapter.setTotalCost(dto.getTripCost() != null ? dto.getTripCost() : java.math.BigDecimal.ZERO);
        chapter.setKey(UUID.randomUUID().toString());
        chapter.setUser(dummyUser);
        TripChapter savedChapter = tripChapterRepository.save(chapter);

        // 2. 일기 항목 생성 (아직 본문은 비어있음)
        DiaryEntry entry = new DiaryEntry();
        entry.setDate(dto.getStartDate()); // 예시: 시작일을 일기 날짜로
        entry.setTripChapter(savedChapter);
        entry.setContent("... AI 분석 대기 중 ...");
        entry.setCreationMethod(dto.getCreationMethod() != null ? dto.getCreationMethod() : "chat");

        DiaryEntry savedEntry = diaryEntryRepository.save(entry);

        return savedEntry;
    }

    /**
     * 프론트엔드(InterviewChat.tsx)에서 채팅 메시지를 저장합니다.
     */
    @Transactional
    public void saveChatMessage(Long diaryEntryId, ChatMessageRequest dto) {
        // (User 정보는 SecurityContext에서 가져와야 함)
        User dummyUser = getDummyUser();
        DiaryEntry entry = diaryEntryRepository.findById(diaryEntryId)
                .orElseThrow(() -> new RuntimeException("일기 항목을 찾을 수 없음"));

        ChatMessage chatMessage = new ChatMessage();
        chatMessage.setSender(dto.getSender()); // "user" 또는 "bot"
        chatMessage.setMessage(dto.getMessage());
        chatMessage.setDiaryEntry(entry);
        chatMessage.setUser(dummyUser);

        chatMessageRepository.save(chatMessage);
    }


    /**
     * ★★★ 핵심 기능 ★★★
     * 특정 일기 항목의 모든 채팅 기록을 가져와 AI에게 요약/분석을 요청하고,
     * 그 결과를 해당 '일기 항목'의 '일기 본문'에 업데이트합니다.
     */
    @Transactional
    public DiaryEntry analyzeAndSaveDiaryContent(Long diaryEntryId) {
        log.info("AI 분석 시작: diaryEntryId={}", diaryEntryId);

        DiaryEntry entry = diaryEntryRepository.findById(diaryEntryId)
                .orElseThrow(() -> new RuntimeException("일기 항목을 찾을 수 없음"));

        // 1. 이 일기 항목에 연결된 모든 채팅 기록 조회
        List<ChatMessage> chatHistory = chatMessageRepository.findByDiaryEntry(entry);
        log.info("채팅 기록 개수: {}", chatHistory.size());

        if (chatHistory.isEmpty()) {
            log.warn("채팅 기록이 없어 AI 분석을 건너뜁니다.");
            entry.setContent("채팅 기록이 없어 일기를 생성할 수 없습니다.");
            entry.setCreationMethod("chat");
            return diaryEntryRepository.save(entry);
        }

        // 2. 채팅 기록을 AI에게 보낼 프롬프트 형식으로 변환
        String chatTranscript = chatHistory.stream()
                .map(chat -> chat.getSender() + ": " + chat.getMessage())
                .collect(Collectors.joining("\n"));

        // 3. Google Generative AI에 분석 요청
        String prompt = "내가 여행 중에 남긴 메모(TXT)와 녹음 내용(음성)을 취합해서 한 편의 나만의 여행 일기를 작성해줘. \n" +
                "말투는 오늘 나는 ~했다, ~기분이 들었다와 같이 담백하고 솔직한 평어(반말)를 사용하고, 격한 표현이나 비속어는 배제하고, 따뜻하고 부드러운 표현으로 바꿔서 적어줘." +
                "나 혼자 여행 또는 타인과의 동행 여부와 상관없이 철저히 나(1인칭)의 시선으로 작성해줘.시간 순서도 좋지만 가장 인상 깊었던 순간을 중심적으로 이야기를 풀어줘.사실 정보(장소, 시간, 메뉴)와 음성의 현장 분위기 및 즉흥적인 감성을 자연스럽게 섞어줘. 그래도 내가 말한 시간 순서는 지켜줘.\n\n" +
                "[대화 내용]\n" + chatTranscript;

        Map<String, Object> body = Map.of(
                "model", model,
                "messages", List.of(Map.of("role", "user", "content", prompt))
        );

        log.info("AI API 요청 시작: model={}, prompt 길이={}", model, prompt.length());

        try {
            Map<String, Object> response = webClient.post()
                    .uri("") // baseUrl에 이미 전체 경로가 포함되어 있음
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block(); // 동기 호출

            log.info("AI API 응답 받음: {}", response != null ? "성공" : "null");

            if (response == null) {
                throw new RuntimeException("AI API 응답이 null입니다.");
            }

            List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
            if (choices == null || choices.isEmpty()) {
                log.error("AI API 응답에 choices가 없습니다: {}", response);
                throw new RuntimeException("AI API 응답에 choices가 없습니다.");
            }

            Map<String, Object> firstChoice = choices.get(0);
            Map<String, Object> message = (Map<String, Object>) firstChoice.get("message");
            if (message == null) {
                log.error("AI API 응답에 message가 없습니다: {}", firstChoice);
                throw new RuntimeException("AI API 응답에 message가 없습니다.");
            }

            String reply = (String) message.get("content");
            if (reply == null || reply.trim().isEmpty()) {
                log.error("AI API 응답에 content가 없습니다: {}", message);
                throw new RuntimeException("AI API 응답에 content가 없습니다.");
            }

            log.info("AI 분석 완료: content 길이={}", reply.length());

            // 4. AI가 생성한 결과를 '일기 항목'의 '일기 본문'에 업데이트
            entry.setContent(reply);
            entry.setCreationMethod("AI_Generated_Chat"); // 생성 방식 변경

            return diaryEntryRepository.save(entry);
        } catch (org.springframework.web.reactive.function.client.WebClientResponseException e) {
            log.error("AI API 호출 실패: status={}, responseBody={}", e.getStatusCode(), e.getResponseBodyAsString(), e);
            throw new RuntimeException("AI 분석 중 오류가 발생했습니다: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("AI 분석 중 예외 발생", e);
            throw new RuntimeException("AI 분석 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

   /**
     * 특정 일기 항목을 조회하고, 현재 사용자가 해당 일기에 접근 권한이 있는지 확인합니다.
     * (인가 체크 포함)
     */
    @Transactional(readOnly = true)
    public DiaryDetailResponse getDiaryDetail(Long entryId, Long userId) {
        
        // 1. 사용자 ID를 기준으로 일기 항목과 관련 데이터를 조회 (인가 체크)
        DailyEntry entry = diaryEntryRepository.findByIdAndUserId(entryId, userId)
                .orElseThrow(() -> new IllegalArgumentException("해당 일기 항목을 찾을 수 없거나 접근 권한이 없습니다."));

        // 2. 미디어 URL 목록 추출 (EntryMedia 엔티티의 fileUrl 필드를 사용한다고 가정)
        // DailyEntry 엔티티에 getMedia() 메서드가 List<EntryMedia>를 반환한다고 가정합니다.
        List<String> mediaUrls = entry.getMedia().stream()
                .map(EntryMedia::getFileUrl) // EntryMedia 엔티티에 getFileUrl() 메서드가 있다고 가정
                .collect(Collectors.toList());

        // 3. DTO로 변환 및 반환 (누락된 로직 완성)
        return DiaryDetailResponse.builder()
                .subtitle(entry.getSubtitle())
                .content(entry.getContent())
                
                // 챕터 정보 추출
                .chapterId(entry.getChapter().getChapterId()) // TripChapter 엔티티에서 ID 추출
                .chapterTitle(entry.getChapter().getTitle()) // TripChapter 엔티티에서 Title 추출
                
                // 미디어 정보
                .mediaUrls(mediaUrls)
                
                // 생성 시간은 BaseTimeEntity에서 상속받은 created_at 필드를 사용한다고 가정
                .chapterCreationTime(entry.getChapter().getCreatedAt()) 
                
                .build();
    }
}