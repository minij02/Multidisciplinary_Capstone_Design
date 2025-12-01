import React, { useState, useEffect, useRef } from 'react';
import './InterviewChat.css';
import { IoChevronBack } from 'react-icons/io5';
import { FaMicrophone, FaStop, FaCheck, FaKeyboard } from 'react-icons/fa';
import { IoSend } from 'react-icons/io5';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

// -----------------------------------------------------------------------------
// 1. Helper Functions
// -----------------------------------------------------------------------------
const getFormattedTime = (dateInput?: string | Date) => {
  const now = dateInput ? new Date(dateInput) : new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hoursStr = hours < 10 ? '0' + hours : hours.toString();
  const minutesStr = minutes < 10 ? '0' + minutes : minutes.toString();
  return `${hoursStr}:${minutesStr} ${ampm}`;
};

// -----------------------------------------------------------------------------
// 2. Types
// -----------------------------------------------------------------------------
interface ChatMessage {
  id: number;
  sender: 'user' | 'bot';
  message: string;
  time: string;
}

// -----------------------------------------------------------------------------
// 3. Component
// -----------------------------------------------------------------------------
const InterviewChat: React.FC = () => {
  const { diaryEntryId } = useParams<{ diaryEntryId: string }>();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 진행률 (임시)
  const progressPercent = 65;

  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('text'); // 기본 text 모드로 시작 (수정 시 편의)
  const [textInput, setTextInput] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // 음성 인식 관련 (더미) - 실제 사용 시 useSpeechRecognition 훅 복구 필요
  const isListening = false;
  const transcript = "";
  const interimTranscript = "";
  const isSupported = true;
  const startListening = () => alert("음성 인식 기능은 로컬 환경 설정이 필요합니다.");
  const stopListening = () => {};
  const clearTranscript = () => {};

  // 스크롤 하단 이동
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ★★★ [핵심] 기존 채팅 내역 불러오기 ★★★
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`http://localhost:8080/api/diary/entry/${diaryEntryId}/chat`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data && Array.isArray(response.data)) {
            // 백엔드 데이터를 프론트엔드 포맷으로 변환
            const formattedHistory: ChatMessage[] = response.data.map((msg: any) => ({
                id: msg.id,
                sender: msg.sender, // 'user' or 'bot'
                message: msg.message,
                time: getFormattedTime(msg.createdAt)
            }));

            // 초기 봇 메시지가 없다면 하나 추가해줄 수도 있음
            if (formattedHistory.length === 0) {
                formattedHistory.push({
                    id: 0,
                    sender: 'bot',
                    message: '이어서 더 들려주고 싶은 이야기가 있나요?',
                    time: getFormattedTime()
                });
            }
            
            setMessages(formattedHistory);
        }
      } catch (error) {
        console.error("채팅 내역 로드 실패:", error);
        // 실패 시 기본 메시지
        setMessages([{
            id: 1, sender: 'bot', 
            message: '이전 대화 내용을 불러오지 못했습니다. 새로운 이야기를 들려주세요.', 
            time: getFormattedTime()
        }]);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    if (diaryEntryId) {
        fetchChatHistory();
    }
  }, [diaryEntryId]);


  // 메시지 UI 추가
  const addMessageToChatUI = (sender: 'user' | 'bot', message: string) => {
    const newMessage: ChatMessage = {
      id: Date.now(), // 임시 ID
      sender: sender,
      message: message,
      time: getFormattedTime(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  // 메시지 저장 API 호출
  const saveChatMessageToApi = async (message: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('accessToken');
      // 1. 메시지 저장
      await axios.post(`http://localhost:8080/api/diary/entry/${diaryEntryId}/chat`, 
        { sender: 'user', message: message },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 2. UI 업데이트
      addMessageToChatUI('user', message);
      
      // 3. 모달 띄우기 (또는 봇 응답 대기 로직 추가 가능)
      setShowConfirmModal(true);

    } catch (error) {
      console.error("메시지 저장 실패:", error);
      alert("메시지 전송 실패");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 텍스트 전송 핸들러
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    saveChatMessageToApi(textInput);
    setTextInput('');
  };

  // 음성 전송 핸들러 (더미 연결)
  const handleSpeechSubmit = () => {
    if (transcript) saveChatMessageToApi(transcript);
  };

  // 취소 (모달 닫기)
  const handleCancelEdit = () => {
    setShowConfirmModal(false);
  };

  // ★ [일기 업데이트] 편집 완료 (AI 재분석 요청)
  const handleConfirmEdit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('accessToken');
      
      // AI 분석 요청 (기존 + 새 채팅 내용을 바탕으로 덮어쓰기됨)
      await axios.post(`http://localhost:8080/api/diary/entry/${diaryEntryId}/analyze`, {}, {
          headers: { Authorization: `Bearer ${token}` }
      });

      alert("일기가 업데이트되었습니다!");
      // 업데이트 후 상세 페이지로 이동
      navigate(`/diary/${diaryEntryId}`);

    } catch (error) {
      console.error("AI 분석 요청 실패:", error);
      alert("일기 업데이트에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
      setShowConfirmModal(false);
    }
  };

  // --- Render Footer ---
  const renderFooter = () => {
    if (inputMode === 'voice') {
      return (
        <div className="chat-footer-voice">
          <button className="toggle-mode-button" onClick={() => setInputMode('text')}>
            <FaKeyboard />
          </button>
          <div className="voice-button-container">
             <button className="mic-button" onClick={startListening}>
                <FaMicrophone />
             </button>
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
          placeholder="이어서 대화하기..."
          autoFocus
        />
        <button className="send-button" type="submit" disabled={isSubmitting}>
          <IoSend />
        </button>
      </form>
    );
  };

  if (isLoadingHistory) {
      return <div className="loading-screen">대화 내역을 불러오는 중...</div>;
  }

  return (
    <div className="interview-page">
      {/* Header */}
      <header className="chat-header">
        <div className="header-icon left" onClick={() => navigate(-1)}>
          <IoChevronBack />
        </div>
        <div className="header-title-container">
          <h1>Interview chat</h1>
          <p className="subtitle">이어서 대화하기</p>
        </div>
        <div className="header-icon right"></div>
      </header>

      {/* Body */}
      <main className="chat-body">
        {messages.map((msg, index) => (
          <div
            key={msg.id || index}
            className={`message-group ${msg.sender === 'user' ? 'sent' : 'received'}`}
          >
            <div className="chat-bubble">
              <p>{msg.message}</p>
            </div>
            <span className="timestamp">{msg.time}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </main>

      {/* Footer */}
      <footer className="chat-footer">
        {renderFooter()}
      </footer>

      {/* Modal */}
      {showConfirmModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3>대화를 마칠까요?</h3>
            <p>추가된 대화 내용으로 일기를 업데이트합니다.</p>
            <div className="modal-buttons">
              <button onClick={handleCancelEdit} className="btn-cancel">더 대화하기</button>
              <button onClick={handleConfirmEdit} className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? "업데이트 중..." : "일기 수정완료"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewChat;