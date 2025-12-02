import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import axios from 'axios'; // ★ 1. API 호출을 위한 axios import

// 2. CSS 임포트 순서
import 'react-datepicker/dist/react-datepicker.css';
import './DiaryWrite.css'; // 👈 우리 커스텀 CSS

import { IoChevronBack } from 'react-icons/io5';
import { FaUserCircle, FaPlane } from 'react-icons/fa';
import { BsImage } from 'react-icons/bs';
import { BiBookContent, BiHomeAlt, BiUser } from 'react-icons/bi';

// -----------------------------------------------------------------------------
// Types & Interfaces
// -----------------------------------------------------------------------------
interface LocationState {
  chapterId?: number;       // 기존 챕터 ID
  diaryTitle?: string;
  arrivalCity?: string;
  startDate?: string;       // YYYY.MM.DD or YYYY-MM-DD
  endDate?: string;         // YYYY.MM.DD or YYYY-MM-DD
  
  // ★ [추가됨] 기존 챕터 정보
  tripNights?: number;
  tripDays?: number;
  tripCost?: number;
  departureCity?: string;
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------
const DiaryWrite: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 1. 이전 페이지에서 넘어온 챕터 정보 받기
  const state = location.state as LocationState || {};

  // ---------------------------------------------------------------------------
  // Duration & Cost Helper
  // ---------------------------------------------------------------------------
  // Date -> "YYYY-MM-DD" 변환 (API 전송용)
  const formatDate = (date: Date | null): string | null => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // [★ 수정된 부분 ★] 날짜 문자열을 안전하게 Date 객체로 변환
  const parseDateString = (dateString: string | null | undefined): Date | null => {
      if (!dateString) return null;
      // YYYY.MM.DD 또는 YYYY-MM-DD 포맷을 YYYY/MM/DD 포맷으로 변환하여 안전하게 파싱
      const safeString = dateString.replace(/-/g, '/').replace(/\./g, '/');
      const date = new Date(safeString);
      
      // 유효한 Date인지 확인
      return isNaN(date.getTime()) ? null : date;
  };


  // 여행 기간 계산 로직 (Date 객체 사용)
  const calculateDuration = (start: Date | null, end: Date | null) => {
    if (!start || !end) return { nights: '0', days: '1' };
    const diff = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diff / (1000 * 3600 * 24));
    return { 
        nights: String(Math.max(0, diffDays)), 
        days: String(Math.max(1, diffDays + 1)) 
    };
  };

  // ---------------------------------------------------------------------------
  // State 초기화 (넘어온 값이 있으면 그것을 초기값으로 사용)
  // ---------------------------------------------------------------------------
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // 시작일: [★ 수정됨] parseDateString 함수 사용하여 초기화
  const [startDate, setStartDate] = useState<Date | null>(
    parseDateString(state.startDate) || new Date()
  );
  // 종료일: [★ 수정됨] parseDateString 함수 사용하여 초기화
  const [endDate, setEndDate] = useState<Date | null>(
    parseDateString(state.endDate) || new Date()
  );

  // 도시 정보 (DepartureCity는 null일 경우 빈 문자열로 초기화)
  const [departureCity, setDepartureCity] = useState(state.departureCity || '');
  const [arrivalCity, setArrivalCity] = useState(state.arrivalCity || '도쿄');
  
  // 제목 (기존 챕터에 추가할 때는 새 일기의 제목이므로 비워두는 것이 일반적)
  const [diaryTitle, setDiaryTitle] = useState('');

  // 기간 및 경비
  const initialDuration = calculateDuration(startDate, endDate);
  
  const [tripNights, setTripNights] = useState(String(state.tripNights || initialDuration.nights));
  const [tripDays, setTripDays] = useState(String(state.tripDays || initialDuration.days));
  // 경비: 넘어온 숫자를 콤마 없이 문자열로 변환하거나, 기본값 사용
  const [tripCost, setTripCost] = useState(String(state.tripCost || '1,130,000'));


  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 날짜 변경 시 박/일 자동 계산
  useEffect(() => {
    const duration = calculateDuration(startDate, endDate);
    setTripNights(duration.nights);
    setTripDays(duration.days);
  }, [startDate, endDate]);


  const handleImageUploaderClick = () => { fileInputRef.current?.click(); };
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setImagePreview(reader.result as string); };
      reader.readAsDataURL(file);
    }
  };

  // ---------------------------------------------------------------------------
  // ★ "음성으로 작성하기" 버튼 클릭 핸들러 (API 호출 분기)
  // ---------------------------------------------------------------------------
  const handleStartVoiceRecord = async () => {
    if (isLoading) return;
    
    // 유효성 검사
    if (!diaryTitle.trim()) { alert('일기 제목을 입력해주세요.'); return; }
    if (!startDate || !endDate) { alert('여행 일정을 확인해주세요.'); return; }
    if (startDate && endDate && startDate > endDate) { alert('여행 시작일은 종료일보다 이전이어야 합니다.'); return; }
    
    setIsLoading(true);

    const diaryData = {
      diaryTitle: diaryTitle,
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      departureCity: departureCity,
      arrivalCity: arrivalCity,
      tripNights: parseInt(tripNights) || 0,
      tripDays: parseInt(tripDays) || 1,
      tripCost: parseFloat(tripCost.replace(/,/g, '')) || 0,
      creationMethod: "chat"
    };

    try {
      const token = localStorage.getItem('accessToken');
      const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
      };

      let response;
      
      if (state.chapterId) {
        // 기존 챕터에 추가 API 호출
        response = await axios.post(
            `http://localhost:8080/api/chapters/${state.chapterId}/diary`, 
            diaryData, 
            { headers }
        );
      } else {
        // 신규 챕터+일기 생성 API 호출
        response = await axios.post(
            'http://localhost:8080/api/diary/chapter', 
            diaryData, 
            { headers }
        );
      }

      const diaryEntryId = response.data;

      if (diaryEntryId) {
        // 채팅 인터뷰 페이지로 이동
        navigate(`/interview/${diaryEntryId}`);
      } else {
        throw new Error("유효한 일기 ID를 받지 못했습니다.");
      }

    } catch (error: any) {
      console.error("일기 생성 실패:", error);
      const msg = error?.response?.data?.message || "일기장 생성에 실패했습니다. 다시 시도해 주세요.";
      alert(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="diary-write-page">
      {/* <style>{styles}</style> // CSS는 별도 파일에서 처리 */}
      <div id="calendar-portal-root"></div>

      {/* 1. 상단 헤더 */}
      <header className="diary-header">
        <IoChevronBack className="icon" onClick={() => navigate(-1)} />
        <h1>일기 작성하기</h1>
        <FaUserCircle className="icon" />
      </header>

      {/* 2. 메인 컨텐츠 영역 */}
      <main className="diary-content">
        <form className="diary-form" onSubmit={(e) => e.preventDefault()}>
          
          {/* 2-1. 표지 이미지 및 일기 제목 */}
          <section className="title-section">
            <div className="image-uploader" onClick={handleImageUploaderClick}>
              <input
                type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} style={{ display: 'none' }}
              />
              {imagePreview ? (
                <img src={imagePreview} alt="표지 이미지 미리보기" className="image-preview" />
              ) : (
                <>
                  <BsImage className="upload-icon" />
                  <span>표지에 넣을 이미지</span>
                </>
              )}
            </div>

            <div className="title-input-wrapper">
              <label htmlFor="diary-title">일기제목</label>
              <input type="text" id="diary-title" className="input-base" value={diaryTitle} onChange={(e) => setDiaryTitle(e.target.value)} />
            </div>
          </section>

          {/* 2-2. 여행 날짜 (DatePicker) */}
          <section className="card date-section">
            <div className="date-item">
              <DatePicker selected={startDate} onChange={(date: Date | null) => setStartDate(date)} dateFormat="yyyy.MM.dd" className="date-picker-input" popperPlacement="bottom-start" portalId="calendar-portal-root" />
              <input type="text" value={departureCity} onChange={(e) => setDepartureCity(e.target.value)} placeholder="출발지" className="city-input input-base" />
            </div>
            <div className="airplane-icon-wrapper">
              <FaPlane />
            </div>
            <div className="date-item">
              <DatePicker selected={endDate} onChange={(date: Date | null) => setEndDate(date)} dateFormat="yyyy.MM.dd" className="date-picker-input" popperPlacement="bottom-start" portalId="calendar-portal-root" />
              <input type="text" value={arrivalCity} onChange={(e) => setArrivalCity(e.target.value)} placeholder="도착지" className="city-input input-base" />
            </div>
          </section>

          {/* 2-3. 일기 내용 입력 */}
          <section className="card content-section">
            <textarea placeholder="이곳에 일기 내용을 입력하세요." className="diary-textarea"></textarea>
          </section>

          {/* 2-4. 여행 요약 */}
          <section className="card summary-section-inputs">
            <div className="summary-row">
              <label>여행기간</label>
              <div className="duration-options">
                <div className="nights-days-inputs">
                  <input type="number" className="input-base nights" value={tripNights} onChange={(e) => setTripNights(e.target.value)} min="0" />
                  <span>박</span>
                  <input type="number" className="input-base days" value={tripDays} onChange={(e) => setTripDays(e.target.value)} min="1" />
                  <span>일</span>
                </div>
              </div>
            </div>
            <div className="summary-row">
              <label htmlFor="cost-input">경비</label>
              <div className="cost-group">
                <input type="text" id="cost-input" className="input-base cost" value={tripCost} onChange={(e) => setTripCost(e.target.value)} />
                <span>원</span>
              </div>
            </div>
          </section>
        </form>

        <button className="voice-button" onClick={handleStartVoiceRecord} disabled={isLoading}>
          {isLoading ? "일기장 생성 중..." : "음성으로 일기 작성하기"}
        </button>
      </main>

      {/* 3. 하단 네비게이션 바 */}
      <footer className="bottom-nav">
        <div className="nav-item" onClick={() => navigate('/diary')}>
          <BiBookContent className="nav-icon" />
          <span>일기페이지</span>
        </div>
        <div className="nav-item active" onClick={() => navigate('/main')}>
          <div className="nav-icon-home">
            <BiHomeAlt />
          </div>
          <span>홈</span>
        </div>
        <div className="nav-item" onClick={() => navigate('/mypage')}>
          <BiUser className="nav-icon" />
          <span>마이페이지</span>
        </div>
      </footer>
    </div>
  );
};

export default DiaryWrite;