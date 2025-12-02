import React, { useState, useEffect, useRef } from 'react';
import './InterviewChat.css';
import { IoChevronBack } from 'react-icons/io5';
import { FaMicrophone, FaStop, FaKeyboard } from 'react-icons/fa';
import { IoSend } from 'react-icons/io5';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

// 💡 [수정] 구현하신 useSpeechRecognition 훅을 import합니다.
// 파일 경로에 맞게 './useSpeechRecognition' 등을 사용하세요.
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
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

  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('text'); 
  const [textInput, setTextInput] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // 💡 [수정] 기존 더미 코드를 구현하신 useSpeechRecognition 훅 호출로 대체
  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    startListening,
    stopListening,
    clearTranscript, // 추가된 clearTranscript 함수 사용
  } = useSpeechRecognition();

  // 스크롤 하단 이동
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // 💡 [추가] 음성 모드일 때 transcript를 textInput에 반영하여 UI에 표시
  useEffect(() => {
    if (inputMode === 'voice') {
      // Interim Transcript를 textInput으로 실시간 업데이트하여 입력창에 반영
      // 최종 결과(transcript)와 중간 결과(interimTranscript)를 합쳐서 표시
      setTextInput(transcript + interimTranscript);
    } else {
      // 텍스트 모드로 전환 시 음성 인식을 중지하고 transcript는 초기화
      stopListening();
    }
  }, [inputMode, transcript, interimTranscript]);
  
  // ★★★ [핵심] 기존 채팅 내역 불러오기 ★★★
  useEffect(() => {
    // (채팅 내역 로드 로직은 변경 없음)
    const fetchChatHistory = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`http://localhost:8080/api/diary/entry/${diaryEntryId}/chat`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data && Array.isArray(response.data)) {
            const formattedHistory: ChatMessage[] = response.data.map((msg: any) => ({
                id: msg.id,
                sender: msg.sender,
                message: msg.message,
                time: getFormattedTime(msg.createdAt)
            }));

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
      
      // 3. 모달 띄우기
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

  // 💡 [수정] 음성 전송 핸들러: 최종 transcript를 전송
  const handleSpeechSubmit = () => {
    if (transcript.trim()) {
      // 최종 인식된 텍스트 전송
      saveChatMessageToApi(transcript); 
      // 전송 후 최종 및 중간 텍스트 초기화
      clearTranscript(); 
      setTextInput('');
    }
    // 전송 후 중지
    stopListening();
  };

  // 💡 [추가] 음성 모드 시작/종료 시 textInput, transcript 초기화 관리
  const handleModeToggle = (mode: 'voice' | 'text') => {
    setInputMode(mode);
    if (mode === 'voice' && isSupported) {
      // 음성 모드로 진입할 때 텍스트 초기화
      setTextInput('');
      clearTranscript();
    } else if (mode === 'text') {
      stopListening();
      // 음성 인식 결과를 텍스트로 옮겨놓을 수도 있지만, 여기서는 초기화 유지
    }
  }

  // 취소 (모달 닫기)
  const handleCancelEdit = () => {
    setShowConfirmModal(false);
  };

  // ★ [일기 업데이트] 편집 완료 (AI 재분석 요청)
  const handleConfirmEdit = async () => {
    // (API 호출 로직은 변경 없음)
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('accessToken');
      
      await axios.post(`http://localhost:8080/api/diary/entry/${diaryEntryId}/analyze`, {}, {
          headers: { Authorization: `Bearer ${token}` }
      });

      alert("일기가 업데이트되었습니다!");
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
    if (!isSupported) {
      return (
        <div className="chat-footer-voice unsupported">
          <p style={{ textAlign: 'center', color: '#888' }}>
            브라우저가 음성 인식을 지원하지 않습니다. (Chrome 권장)
          </p>
        </div>
      );
    }

    if (inputMode === 'voice') {
      return (
        <div className="chat-footer-voice">
          <button className="toggle-mode-button" onClick={() => handleModeToggle('text')}>
            <FaKeyboard />
          </button>

          <div className="voice-button-container">
            {isListening ? (
              // 💡 녹음 중: 중지 버튼
              <button className="mic-button stop" onClick={stopListening}>
                <FaStop />
              </button>
            ) : (
              // 💡 녹음 중이 아님: 시작 버튼
              <button className="mic-button" onClick={startListening}>
                <FaMicrophone />
              </button>
            )}
          </div>
          
          {/* 💡 전송 버튼: transcript가 있어야 활성화 */}
          <button 
            className="send-button voice-send-button" 
            onClick={handleSpeechSubmit} 
            disabled={isSubmitting || !transcript.trim()}
          >
            <IoSend />
          </button>
        </div>
      );
    }
    return (
      <form className="chat-footer-text" onSubmit={handleTextSubmit}>
        <button 
          className="toggle-mode-button" 
          type="button" 
          onClick={() => handleModeToggle('voice')}
        >
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
        <button className="send-button" type="submit" disabled={isSubmitting || !textInput.trim()}>
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