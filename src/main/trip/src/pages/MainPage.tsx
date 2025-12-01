import React, { useState, useEffect, useMemo } from 'react';
import { User, ChevronLeft, ChevronRight, Home, Search, BookOpen, Clock } from 'lucide-react';
import './MainPage.css'; // 👈 새로 정의할 CSS 파일 임포트

// 백엔드 DTO 변경 사항 반영
interface DiaryEntryItem {
    entryId: number;
    date: string; // "YYYY-MM-DD"
}

// API 응답 DTO를 모방한 타입 정의
interface MainPageResponse {
    userId: number;
    userName: string;
    userEmail: string;
    totalDiaryCount: number;
    favoriteDiaryCount: number;
    diaryEntries: DiaryEntryItem[]; 
}

const API_URL = "http://localhost:8080/api/page/main";
const API_MAX_RETRIES = 3;

/**
 * 지수 백오프를 사용한 API 호출 및 재시도 로직
 */
const fetchMainPageData = async (): Promise<MainPageResponse> => {
    // 1. 저장된 토큰을 localStorage에서 가져온다고 가정 (실제 구현에 따라 다를 수 있음)
    // NOTE: 실제 프로젝트에서는 보안을 위해 HttpOnly Cookie나 다른 안전한 방법을 사용해야 합니다.
    const token = localStorage.getItem('accessToken'); 
    
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    
    if (token) {
        // 토큰이 있다면 Authorization 헤더에 Bearer 토큰 형식으로 추가
        headers['Authorization'] = `Bearer ${token}`;
    } else {
        console.error("인증 토큰을 찾을 수 없습니다. 로그인 상태를 확인하세요.");
        throw new Error("인증되지 않은 사용자입니다. 로그인이 필요합니다.");
    }
    
    let lastError = null;
    for (let i = 0; i < API_MAX_RETRIES; i++) {
        try {
            const response = await fetch(API_URL, {
                headers: headers, // 인증 헤더를 포함하여 요청
            });

            if (response.ok) {
                return await response.json();
            } else if (response.status === 401) {
                // 401 Unauthorized 오류 시 재시도 없이 즉시 에러 throw
                throw new Error("인증 토큰이 만료되었거나 유효하지 않습니다. 다시 로그인해 주세요.");
            }
             else {
                throw new Error(`서버 응답 오류: ${response.status} ${response.statusText}`);
            }
        } catch (err) {
            lastError = err;
            if (i < API_MAX_RETRIES - 1) {
                // 401이 아닌 다른 오류 (주로 5xx)에 대해서만 재시도
                if (err instanceof Error && err.message.includes("인증 토큰이 만료")) {
                    throw lastError; // 인증 오류는 재시도하지 않음
                }
                console.warn(`API 호출 실패, 재시도 중... (시도 ${i + 1})`);
                const delay = Math.pow(2, i) * 1000 + Math.random() * 500;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    // err가 unknown 타입이므로 throw 전에 에러인지 확인 후 throw
    if (lastError instanceof Error) {
        throw lastError;
    }
    // 예기치 않은 오류 처리 (Error 객체가 아닐 경우)
    throw new Error(`API 호출 중 예기치 않은 오류 발생: ${lastError}`);
};

// --- 달력 관련 헬퍼 함수 ---

/** 주어진 년/월의 총 일수를 계산 */
const daysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate();
};

/** 주어진 년/월의 1일이 무슨 요일인지 (0=일요일) 계산 */
const firstDayOfMonth = (year: number, month: number): number => {
    return new Date(year, month, 1).getDay();
};

const getMonthName = (monthIndex: number): string => {
    const names = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
    return names[monthIndex % 12];
}

// --- 로딩 아이콘 ---
const Loader2 = ({ className = 'h-5 w-5', size = 24 }: { className?: string, size?: number }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
);

// --- 메인 컴포넌트 ---

const MainPage: React.FC = () => {
    const [data, setData] = useState<MainPageResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // 현재 달력에 표시할 년도와 월 (Date 객체의 월은 0부터 시작)
    const today = useMemo(() => new Date(), []);
    const [currentDate, setCurrentDate] = useState(today);

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0 (Jan) - 11 (Dec)

     // 2. 데이터 구조 변경: Set<string> -> Map<string, number>
    // 날짜(Key)를 주면 일기ID(Value)를 바로 찾을 수 있도록 Map 사용
    const diaryMap = useMemo(() => {
        const map = new Map<string, number>();
        if (data?.diaryEntries) {
            data.diaryEntries.forEach(item => {
                map.set(item.date, item.entryId);
            });
        }
        return map;
    }, [data]);

    // --- 데이터 로딩 이펙트 ---
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError(null);
            try {
                const fetchedData = await fetchMainPageData();
                setData(fetchedData);
            } catch (err) {
                // err가 unknown 타입이므로 Error 인스턴스인지 확인
                const errorMessage = err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
                
                if (errorMessage.includes("인증되지 않은 사용자입니다.") || errorMessage.includes("인증 토큰이 만료")) {
                    console.log("인증 실패, 로그인 페이지로 이동"); 
                    // navigate('/login'); 
                }
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // --- 달력 UI 렌더링 로직 ---
    const renderCalendar = () => {
        const totalDays = daysInMonth(currentYear, currentMonth);
        const startDay = firstDayOfMonth(currentYear, currentMonth);
        const days = [];
        
        // 빈 칸 채우기 (1일 전까지)
        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day-cell empty"></div>);
        }

        // 날짜 채우기
        for (let day = 1; day <= totalDays; day++) {
            const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            // 3. Map에서 해당 날짜의 ID 조회
            const entryId = diaryMap.get(dateString); 
            const hasDiary = entryId !== undefined;
            
            const dayClass = hasDiary
                ? 'diary-day'
                : 'normal-day';
            
            days.push(
                <div 
                    key={day} 
                    className="calendar-day-cell"
                >
                    <span className={`calendar-date-bubble ${dayClass}`}>
                        {day}
                    </span>
                    {/* 이미지처럼 일기 작성 마커 표시 (플레이스홀더) */}
                    {hasDiary && day % 5 === 0 && (
                            <Clock size={12} className="diary-marker" />
                    )}
                </div>
            );
        }

        return days;
    };

    // 달 이동 핸들러
    const handleMonthChange = (direction: -1 | 1) => {
        const newDate = new Date(currentDate.getTime());
        newDate.setMonth(currentMonth + direction);
        setCurrentDate(newDate);
    };

    if (loading) {
        return (
            <div className="loading-container">
                <Loader2 className="loader-icon" size={40} />
                <p className="loading-text">데이터를 불러오는 중...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <p className="error-title">오류 발생:</p>
                <p className="error-message">{error}</p>
                {error.includes("인증") && (
                    <button 
                        className="login-button"
                    >
                        로그인 페이지로 이동
                    </button>
                )}
            </div>
        );
    }

    const { userName, totalDiaryCount = 0, favoriteDiaryCount = 0 } = data || {};
    
    // 프로필 이미지 (플레이스홀더)
    const profileImageUrl = "https://placehold.co/100x100/fecaca/9f1239?text=DAHAKJE";

    return (
        <div className="main-page-container">
            
            {/* 1. 상단 헤더 (네비게이션) */}
            <header className="header-nav">
                <BookOpen className="nav-icon" size={24} />
                <h1 className="header-title">메인페이지</h1>
                <User className="nav-icon" size={24} />
            </header>

            {/* 2. 메인 콘텐츠 영역 */}
            <main className="main-content">

                {/* 프로필 카드 */}
                <div className="profile-card">
                    <img
                        src={profileImageUrl}
                        alt="User Profile"
                        className="profile-image"
                        onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => { 
                             e.currentTarget.onerror = null; 
                             e.currentTarget.src = 'https://placehold.co/100x100/cccccc/333333?text=User'; 
                        }}
                    />
                    <h2 className="user-name">
                        {userName || "다학재"}'s Diary
                    </h2>
                    <p className="user-info-detail">
                        00.00.01 여자
                    </p>
                    <p className="user-motto">
                        나홀로 여행을 좋아해요
                    </p>
                </div>

                {/* 통계 카드 (All / Favorite) */}
                <div className="stats-card-group">
                    {/* All (전체 작성 일기 수) */}
                    <div className="stat-card total-stat">
                        <span className="stat-value">{totalDiaryCount}</span>
                        <span className="stat-label">All</span>
                    </div>
                    {/* Favorite (좋아요 일기 수) */}
                    <div className="stat-card favorite-stat">
                        <span className="stat-value">{favoriteDiaryCount}</span>
                        <span className="stat-label">Favorite</span>
                    </div>
                </div>

                {/* 캘린더 카드 */}
                <div className="calendar-card">
                    {/* 달력 헤더 (이동 버튼 및 월/년) */}
                    <div className="calendar-header">
                        <ChevronLeft 
                            size={20} 
                            className="calendar-arrow" 
                            onClick={() => handleMonthChange(-1)} 
                        />
                        <h3 className="calendar-month-year">
                            {getMonthName(currentMonth)} {currentYear}
                        </h3>
                        <ChevronRight 
                            size={20} 
                            className="calendar-arrow" 
                            onClick={() => handleMonthChange(1)} 
                        />
                    </div>
                    
                    {/* 요일 표시 */}
                    <div className="calendar-weekdays">
                        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                            <div key={day} className="weekday-label">{day}</div>
                        ))}
                    </div>

                    {/* 날짜 그리드 */}
                    <div className="calendar-grid">
                        {renderCalendar()}
                    </div>
                </div>

            </main>

            {/* 3. 하단 네비게이션 */}
            <footer className="bottom-nav-footer">
                <div className="nav-group">
                    {/* 일기 페이지 (BookOpen) */}
                    <div className="nav-item">
                        <BookOpen size={24} />
                        <span>일기페이지</span>
                    </div>
                    
                    {/* 홈 버튼 (가운데 큰 버튼) */}
                    <div className="nav-item-center">
                        <div className="home-button-bubble">
                            <Home size={32} className="home-icon" />
                        </div>
                    </div>

                    {/* 마이 페이지 (Search) */}
                    <div className="nav-item">
                        <Search size={24} />
                        <span>마이페이지</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default MainPage;