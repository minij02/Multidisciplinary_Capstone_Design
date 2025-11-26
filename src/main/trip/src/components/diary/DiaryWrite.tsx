import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import axios from 'axios'; // ★ 1. API 호출을 위한 axios import

// 2. CSS 임포트 순서
import 'react-datepicker/dist/react-datepicker.css';
import './DiaryWrite.css'; // 👈 우리 커스텀 CSS

import { IoChevronBack } from 'react-icons/io5';
import { FaUserCircle, FaPlane } from 'react-icons/fa';
import { BsImage } from 'react-icons/bs';
import { BiBookContent, BiHomeAlt, BiUser } from 'react-icons/bi';

const DiaryWrite: React.FC = () => {
  const navigate = useNavigate();

  // --- (state 변수들은 이전과 동일) ---
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [departureCity, setDepartureCity] = useState('');
  const [arrivalCity, setArrivalCity] = useState('도쿄');
  const [tripNights, setTripNights] = useState('3');
  const [tripDays, setTripDays] = useState('4');
  const [tripCost, setTripCost] = useState('1,130,000');
  const [diaryTitle, setDiaryTitle] = useState('낯선 공기와 설렘. 도쿄');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false); // ★ 3. (신규) API 호출 중 로딩 상태

  // --- (이미지 핸들러 등은 이전과 동일) ---
  const handleImageUploaderClick = () => { fileInputRef.current?.click(); };
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setImagePreview(reader.result as string); };
      reader.readAsDataURL(file);
    }
  };

  // ★ 4. (★★★★★) "음성으로 작성하기" 버튼 핸들러 수정
  // (API 호출 기능이 추가된 최종 버전입니다.)
  const handleStartVoiceRecord = async () => {
    if (isLoading) return; // 중복 클릭 방지
    
    // 유효성 검사
    if (!diaryTitle || diaryTitle.trim() === '') {
      alert('일기 제목을 입력해주세요.');
      return;
    }
    if (!startDate) {
      alert('여행 시작일을 선택해주세요.');
      return;
    }
    if (!endDate) {
      alert('여행 종료일을 선택해주세요.');
      return;
    }
    if (startDate > endDate) {
      alert('여행 시작일은 종료일보다 이전이어야 합니다.');
      return;
    }
    
    setIsLoading(true);

    // 날짜를 YYYY-MM-DD 형식의 문자열로 변환하는 헬퍼 함수
    const formatDate = (date: Date | null): string | null => {
      if (!date) return null;
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // 1. API로 보낼 DTO 객체 생성 (DiaryCreateRequestDto)
    // (Spring Service가 받을 수 있도록 데이터를 가공)
    const diaryData = {
      diaryTitle: diaryTitle,
      startDate: formatDate(startDate), // Date 객체를 YYYY-MM-DD 문자열로 변환
      endDate: formatDate(endDate),     // Date 객체를 YYYY-MM-DD 문자열로 변환
      departureCity: departureCity, // `여행 챕터`에 추가한 컬럼
      arrivalCity: arrivalCity,     // `여행 챕터`에 추가한 컬럼
      tripNights: parseInt(tripNights) || 0, // String -> Integer (기본값 0)
      tripDays: parseInt(tripDays) || 1,     // String -> Integer (기본값 1)
      tripCost: parseFloat(tripCost.replace(/,/g, '')) || 0, // "1,130,000" -> 1130000 (BigDecimal/Float)
      creationMethod: "chat" // "음성으로 작성"을 선택했으므로 "chat"
    };

    try {
      // 2. (API 호출 #1) Spring Boot에 챕터 생성을 요청
      // (package.json의 "proxy" 설정 덕분에 '/api'로 바로 호출)
      const response = await axios.post('http://localhost:8080/api/diary/chapter', diaryData);

      // 3. 백엔드가 생성한 '일기 항목 ID' (diaryEntryId)를 받음
      const diaryEntryId = response.data; // (Controller가 Long ID를 반환)

      if (diaryEntryId) {
        // 4. ID를 가지고 채팅 페이지로 이동
        navigate(`/interview/${diaryEntryId}`);
      } else {
        throw new Error("유효한 일기 ID를 받지 못했습니다.");
      }

    } catch (error: any) {
      console.error("일기 챕터 생성 실패:", error);
      // 에러 메시지가 있으면 표시, 없으면 기본 메시지
      const errorMessage = error?.response?.data?.message || error?.message || "일기장 생성에 실패했습니다. 다시 시도해 주세요.";
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="diary-write-page">
      <div id="calendar-portal-root"></div>

      {/* 1. 상단 헤더 */}
      <header className="diary-header">
        <IoChevronBack className="icon" onClick={() => navigate(-1)} />
        <h1>일기 작성하기</h1>
        <FaUserCircle className="icon" />
      </header>

      {/* 2. 메인 컨텐츠 영역 */}
      <main className="diary-content">
        <form className="diary-form">
          {/* 2-1. 표지 이미지 및 일기 제목 */}
          <section className="title-section">
            <div className="image-uploader" onClick={handleImageUploaderClick}>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageChange}
                style={{ display: 'none' }}
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
              <input
                type="text"
                id="diary-title"
                className="input-base"
                value={diaryTitle}
                onChange={(e) => setDiaryTitle(e.target.value)}
              />
            </div>
          </section>

          {/* 2-2. 여행 날짜 (DatePicker) */}
          <section className="card date-section">
            <div className="date-item">
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                dateFormat="yyyy.MM.dd"
                className="date-picker-input"
                popperPlacement="bottom-start"
                portalId="calendar-portal-root"
              />
              <input
                type="text"
                value={departureCity}
                onChange={(e) => setDepartureCity(e.target.value)}
                placeholder="출발지"
                className="city-input input-base"
              />
            </div>
            <div className="airplane-icon-wrapper">
              <FaPlane />
            </div>
            <div className="date-item">
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                dateFormat="yyyy.MM.dd"
                className="date-picker-input"
                popperPlacement="bottom-start"
                portalId="calendar-portal-root"
              />
              <input
                type="text"
                value={arrivalCity}
                onChange={(e) => setArrivalCity(e.target.value)}
                placeholder="도착지"
                className="city-input input-base"
              />
            </div>
          </section>

          {/* 2-3. 일기 내용 입력 */}
          <section className="card content-section">
            <textarea
              placeholder="이곳에 일기 내용을 입력하세요."
              className="diary-textarea"
            ></textarea>
          </section>

          {/* 2-4. 여행 요약 */}
          <section className="card summary-section-inputs">
            <div className="summary-row">
              <label>여행기간</label>
              <div className="duration-options">
                <div className="nights-days-inputs">
                  <input
                    type="number"
                    className="input-base nights"
                    value={tripNights}
                    onChange={(e) => setTripNights(e.target.value)}
                    min="0"
                  />
                  <span>박</span>
                  <input
                    type="number"
                    className="input-base days"
                    value={tripDays}
                    onChange={(e) => setTripDays(e.target.value)}
                    min="1"
                  />
                  <span>일</span>
                </div>
              </div>
            </div>
            <div className="summary-row">
              <label htmlFor="cost-input">경비</label>
              <div className="cost-group">
                <input
                  type="text"
                  id="cost-input"
                  className="input-base cost"
                  value={tripCost}
                  onChange={(e) => setTripCost(e.target.value)}
                />
                <span>원</span>
              </div>
            </div>
          </section>
        </form>

        {/* 2-5. 음성 작성 버튼 */}
        <button
          className="voice-button"
          onClick={handleStartVoiceRecord}
          disabled={isLoading} // ★ 5. 로딩 중일 때 버튼 비활성화
        >
          {isLoading ? "일기장 생성 중..." : "음성으로 일기 작성하기"}
        </button>
      </main>

      {/* 3. 하단 네비게이션 바 */}
      <footer className="bottom-nav">
        <div className="nav-item">
          <BiBookContent className="nav-icon" />
          <span>일기페이지</span>
        </div>
        <div className="nav-item active">
          <div className="nav-icon-home">
            <BiHomeAlt />
          </div>
          <span>홈</span>
        </div>
        <div className="nav-item">
          <BiUser className="nav-icon" />
          <span>마이페이지</span>
        </div>
      </footer>
    </div>
  );
};

export default DiaryWrite;