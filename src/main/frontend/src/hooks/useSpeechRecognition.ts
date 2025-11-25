import { useState, useEffect, useRef } from 'react';

// 브라우저 API에 접근
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

if (recognition) {
  recognition.continuous = true;
  recognition.lang = 'ko-KR';
  recognition.interimResults = true;
}

/**
 * 음성 인식을 처리하는 커스텀 훅
 */
export const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState(''); // "최종" 결과
  const [interimTranscript, setInterimTranscript] = useState(''); // "중간" 결과
  const [isSupported, setIsSupported] = useState(!!recognition);
  const recognitionRef = useRef(recognition);

  useEffect(() => {
    const rec = recognitionRef.current;
    if (!rec) return;

    // 음성 인식 결과가 나왔을 때
    rec.onresult = (event: any) => {
      let final_transcript = '';
      let interim_transcript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript_piece = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final_transcript += transcript_piece;
        } else {
          interim_transcript += transcript_piece;
        }
      }
      setTranscript(prev => prev + final_transcript);
      setInterimTranscript(interim_transcript);
    };

    // 음성 인식이 끝났을 때
    rec.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
    };
    // 오류 발생 시
    rec.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      setInterimTranscript('');
    };

    return () => {
      rec.stop();
    };
  }, []);

  // 녹음 시작 함수
  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      setInterimTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // 녹음 중지 함수
  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  // ★ "최종" 텍스트를 수동으로 비우는 함수 추가
  const clearTranscript = () => {
    setTranscript('');
  };

  return {
    isListening,       // 현재 녹음 중인지 (true/false)
    transcript,        // "최종" 변환된 텍스트
    interimTranscript, // "중간" 변환 중인 텍스트
    isSupported,       // 브라우저가 지원하는지
    startListening,    // 녹음 시작 함수
    stopListening,     // 녹음 중지 함수
    clearTranscript,   // ★ 밖에서 쓸 수 있도록 반환
  };
};