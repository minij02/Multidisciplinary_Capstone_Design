import React, { useState } from 'react';
import './InterviewChat.css';
import { IoChevronBack } from 'react-icons/io5';
import { FaMicrophone, FaStop, FaCheck, FaKeyboard } from 'react-icons/fa';
import { IoSend } from 'react-icons/io5';
import { useNavigate, useParams } from 'react-router-dom';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import axios from 'axios'; // API 호출

// --- (getFormattedTime 함수) ---
const getFormattedTime = () => {
  const now = new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hoursStr = hours < 10 ? '0' + hours : hours.toString();
  const minutesStr = minutes < 10 ? '0' + minutes : minutes.toString();
  return `${hoursStr}:${minutesStr} ${ampm}`;
};

// --- (ChatMessage 인터페이스) ---
interface ChatMessage {
  id: number;
  sender: 'user' | 'bot';
  message: string;
  time: string;
}

// --- (MicState 타입) ---
type MicState = 'ready' | 'recording' | 'completed';

// --- (컴포넌트 시작) ---
const InterviewChat: React.FC = () => {
  const progressPercent = 65;

  // ★ URL에서 diaryEntryId 가져오기
  const { diaryEntryId } = useParams<{ diaryEntryId: string }>();

  // ★ (수정) navigate는 여기서 "한 번"만 선언합니다.
  const navigate = useNavigate();

  // --- (훅 사용 및 state 선언) ---
  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    startListening,
    stopListening,
    clearTranscript
  } = useSpeechRecognition();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      sender: 'bot',
      message: '오늘은 여행에서 가장 좋았던 일이나, 조금 아쉬웠던 일이 있으신가요?',
      time: getFormattedTime(),
    },
  ]);
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const [textInput, setTextInput] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // 로딩 상태

  // --- (메시지 UI 추가 공통 함수) ---
  const addMessageToChatUI = (sender: 'user' | 'bot', message: string) => {
    const newMessage: ChatMessage = {
      id: messages.length + 1,
      sender: sender,
      message: message,
      time: getFormattedTime(),
    };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
  };

  // ★ 백엔드로 채팅 메시지를 "저장"하고 "팝업" 띄우기
  const saveChatMessageToApi = async (message: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const chatDto = { // ChatMessageRequestDto
      sender: 'user',
      message: message
    };

    try {
      // (API 호출 #2) 채팅 메시지 저장
      await axios.post(`http://localhost:8080/api/diary/entry/${diaryEntryId}/chat`, chatDto);

      // API 저장 성공 시 프론트 UI에 반영
      addMessageToChatUI('user', message);

      // "메시지 1회 전송 -> 즉시 팝업" 플로우
      setShowConfirmModal(true);

    } catch (error) {
      console.error("채팅 메시지 저장 실패:", error);
      alert("메시지 전송에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // [✓] 음성 전송
  const handleSpeechSubmit = () => {
    if (!transcript) return;
    saveChatMessageToApi(transcript); // ★ API 호출
  };

  // [▶] 텍스트 전송
  const handleTextSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!textInput.trim()) return;
    saveChatMessageToApi(textInput); // ★ API 호출
    setTextInput('');
  };

  // --- (나머지 핸들러 함수들) ---
  const handleStartRecording = () => {
    if (!isSupported) { alert("음성 인식을 지원하지 않습니다."); return; }
    startListening();
  };
  const handleStopRecording = () => { stopListening(); };

  // ★ "취소" 버튼 (삭제 기능)
  const handleCancelEdit = () => {
    setShowConfirmModal(false); // 1. 팝업 닫기

    setMessages(prevMessages => {
      if (prevMessages.length > 1) { // 봇 메시지(1개)보다 많을 때
        return prevMessages.slice(0, -1); // 마지막 'user' 메시지 삭제
      }
      return prevMessages;
    });

    // 3. 음성인식 [✓] 버튼을 [🎤]로 되돌리기
    clearTranscript();
  };

  // ★ "편집 완료" 버튼 (AI 분석 요청)
  const handleConfirmEdit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // (API 호출 #3) Spring AI 분석 요청
      await axios.post(`http://localhost:8080/api/diary/entry/${diaryEntryId}/analyze`);

      // 분석 성공! 다음 페이지(이미지 선택)로 이동
      navigate(`/diary/select-image/${diaryEntryId}`);

    } catch (error) {
      console.error("AI 분석 요청 실패:", error);
      alert("일기 생성에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
      setShowConfirmModal(false);
    }
  };

  // --- (하단 푸터 렌더링 함수) ---
  const renderFooter = () => {
    if (inputMode === 'voice') {
      let button;
      if (isListening) {
        button = (
          <button className="mic-button recording" onClick={handleStopRecording} aria-label="녹음 중지">
            <FaStop />
          </button>
        );
      } else if (!isListening && transcript) {
        button = (
          <button className="mic-button completed" onClick={handleSpeechSubmit} aria-label="확인">
            <FaCheck />
          </button>
        );
      } else {
        button = (
          <button className="mic-button" onClick={handleStartRecording} aria-label="음성 녹음 시작" disabled={!isSupported}>
            <FaMicrophone />
          </button>
        );
      }
      return (
        <div className="chat-footer-voice">
          <button className="toggle-mode-button" onClick={() => setInputMode('text')}>
            <FaKeyboard />
          </button>
          <div className="voice-button-container">
            {button}
          </div>
          <div className="toggle-mode-button-placeholder"></div>
        </div>
      );
    }
    return (
      <form className="chat-footer-text" onSubmit={handleTextSubmit}>
        <button className="toggle-mode-button" type="button" onClick={() => setInputMode('voice')}>
          <FaMicrophone />
        </button>
        <input
          type="text"
          className="text-input"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="메시지 입력..."
          autoFocus
        />
        <button className="send-button" type="submit" disabled={isSubmitting}>
          <IoSend />
        </button>
      </form>
    );
  };

  return (
    <div className="interview-page">

      {/* (헤더: "완료" 버튼이 없는 원래 버전) */}
      <header className="chat-header">
        <div className="header-icon left" onClick={() => navigate(-1)}>
          <IoChevronBack />
        </div>
        <div className="header-title-container">
          <h1>Interview chat</h1>
          <p className="subtitle">{progressPercent}% completed</p>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
        <div className="header-icon right"></div>
      </header>

      {/* (메인 채팅) */}
      <main className="chat-body">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message-group ${msg.sender === 'user' ? 'sent' : 'received'}`}
          >
            <div className="chat-bubble">
              <p>{msg.message}</p>
            </div>
            <span className="timestamp">{msg.time}</span>
          </div>
        ))}
        {interimTranscript && (
          <div className="message-group sent">
            <div className="chat-bubble interim">
              <p>{interimTranscript}...</p>
            </div>
          </div>
        )}
      </main>

      {/* (하단 푸터) */}
      <footer className="chat-footer">
        {renderFooter()}
      </footer>

      {/* (팝업 모달) */}
      {showConfirmModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3>일기편집을 완료할까요?</h3>
            <p>편집을 완료하면 사진을 추가할 수 있습니다.</p>
            <div className="modal-buttons">
              <button onClick={handleCancelEdit} className="btn-cancel">취소</button>
              <button onClick={handleConfirmEdit} className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? "분석 중..." : "편집완료"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewChat;