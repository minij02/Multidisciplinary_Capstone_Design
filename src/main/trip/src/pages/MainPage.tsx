import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ChevronLeft, ChevronRight, Home, Search, BookOpen, Clock } from 'lucide-react';
import './MainPage.css'; // CSS 파일 임포트

// -----------------------------------------------------------------------------
// 2. Types & Interfaces
// -----------------------------------------------------------------------------
interface DiaryEntryItem {
    entryId: number;
    date: string;
}

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

// -----------------------------------------------------------------------------
// 3. API Logic
// -----------------------------------------------------------------------------
const fetchMainPageData = async (): Promise<MainPageResponse> => {
    const token = localStorage.getItem('accessToken');
    
    // [테스트용 Fallback] 토큰이 없거나, 로컬 개발 환경일 때 더미 데이터 반환
    if (!token) {
        console.warn("[MainPage] 토큰 없음. 더미 데이터를 사용합니다.");
        return new Promise(resolve => setTimeout(() => resolve({
            userId: 1,
            userName: "다학재",
            userEmail: "test@example.com",
            totalDiaryCount: 7,
            favoriteDiaryCount: 2,
            diaryEntries: [
                { entryId: 101, date: "2024-10-01" }, // 도쿄 1
                { entryId: 102, date: "2024-10-02" }, // 도쿄 2
                { entryId: 103, date: "2024-10-04" }, // 도쿄 3
                { entryId: 201, date: "2025-01-10" }, // 파리
                { entryId: 202, date: "2025-01-12" },
                { entryId: 203, date: "2025-01-14" },
                { entryId: 301, date: "2025-03-20" }, // 제주
            ]
        }), 500));
    }

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
    
    let lastError = null;
    for (let i = 0; i < API_MAX_RETRIES; i++) {
        try {
            const response = await fetch(API_URL, { headers });
            if (response.ok) return await response.json();
            if (response.status === 401) throw new Error("인증 토큰이 만료되었습니다.");
            throw new Error(`서버 응답 오류: ${response.status}`);
        } catch (err) {
            lastError = err;
            if (i < API_MAX_RETRIES - 1) {
                if (err instanceof Error && err.message.includes("인증")) throw lastError;
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
            }
        }
    }
    throw lastError || new Error("API 호출 실패");
};

// -----------------------------------------------------------------------------
// 4. Helper Functions
// -----------------------------------------------------------------------------
const daysInMonth = (year: number, month: number): number => new Date(year, month + 1, 0).getDate();
const firstDayOfMonth = (year: number, month: number): number => new Date(year, month, 1).getDay();
const getMonthName = (monthIndex: number): string => {
    const names = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
    return names[monthIndex % 12];
}

const Loader2 = ({ className = 'h-5 w-5', size = 24 }: { className?: string, size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
);

// -----------------------------------------------------------------------------
// 5. Main Component
// -----------------------------------------------------------------------------
const MainPage: React.FC = () => {
    const navigate = useNavigate();
    const [data, setData] = useState<MainPageResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // [중요 수정] 날짜 초기화 시 타임존 이슈 방지를 위해 (년, 월, 일) 생성자 사용
    // 2024년 10월 1일 (월은 0부터 시작: 9 -> 10월)
    const [currentDate, setCurrentDate] = useState(new Date(2024, 9, 1)); 

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    const diaryMap = useMemo(() => {
        const map = new Map<string, number>();
        if (data?.diaryEntries) {
            data.diaryEntries.forEach(item => {
                map.set(item.date, item.entryId);
            });
        }
        return map;
    }, [data]);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const fetchedData = await fetchMainPageData();
                console.log("Fetched Data:", fetchedData); // 데이터 확인용 로그
                setData(fetchedData);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "알 수 없는 오류";
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const renderCalendar = () => {
        const totalDays = daysInMonth(currentYear, currentMonth);
        const startDay = firstDayOfMonth(currentYear, currentMonth);
        const days = [];
        
        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day-cell empty"></div>);
        }

        for (let day = 1; day <= totalDays; day++) {
            // 날짜 문자열 생성 (YYYY-MM-DD)
            const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            const entryId = diaryMap.get(dateString); 
            const hasDiary = entryId !== undefined;
            const dayClass = hasDiary ? 'diary-day' : 'normal-day';
            
            days.push(
                <div 
                    key={day} 
                    className="calendar-day-cell"
                    // 클릭 이벤트
                    onClick={() => {
                        console.log(`Clicked Date: ${dateString}, EntryID: ${entryId}`); // 디버깅 로그
                        if (hasDiary) {
                            navigate(`/diary/${entryId}`);
                        }
                    }}
                    style={{ cursor: hasDiary ? 'pointer' : 'default' }}
                >
                    <span className={`calendar-date-bubble ${dayClass}`}>
                        {day}
                    </span>
                    {hasDiary && (
                         <Clock size={12} className="diary-marker" />
                    )}
                </div>
            );
        }
        return days;
    };

    const handleMonthChange = (direction: -1 | 1) => {
        const newDate = new Date(currentDate.getTime());
        newDate.setMonth(currentMonth + direction);
        setCurrentDate(newDate);
    };

    if (loading) return <div className="loading-container"><Loader2 className="loader-icon" size={40} /><p className="loading-text">데이터를 불러오는 중...</p></div>;
    if (error) return <div className="error-container"><p className="error-title">오류 발생:</p><p className="error-message">{error}</p><button className="login-button" onClick={() => navigate('/login')}>로그인 페이지로 이동</button></div>;

    const { userName, totalDiaryCount = 0, favoriteDiaryCount = 0 } = data || {};
    const profileImageUrl = "https://placehold.co/100x100/fecaca/9f1239?text=DAHAKJE";

    return (
        <div className="main-page-container">
            <header className="header-nav">
                <BookOpen className="nav-icon" size={24} />
                <h1 className="header-title">메인페이지</h1>
                <User className="nav-icon" size={24} />
            </header>

            <main className="main-content">
                <div className="profile-card">
                    <img src={profileImageUrl} alt="Profile" className="profile-image" onError={(e) => {e.currentTarget.src='https://placehold.co/100x100/cccccc/333333?text=User'}} />
                    <h2 className="user-name">{userName || "다학재"}'s Diary</h2>
                    <p className="user-info-detail">00.00.01 여자</p>
                    <p className="user-motto">나홀로 여행을 좋아해요</p>
                </div>

                <div className="stats-card-group">
                    <div className="stat-card total-stat">
                        <span className="stat-value">{totalDiaryCount}</span>
                        <span className="stat-label">All</span>
                    </div>
                    <div className="stat-card favorite-stat">
                        <span className="stat-value">{favoriteDiaryCount}</span>
                        <span className="stat-label">Favorite</span>
                    </div>
                </div>

                <div className="calendar-card">
                    <div className="calendar-header">
                        <ChevronLeft size={20} className="calendar-arrow" onClick={() => handleMonthChange(-1)} />
                        <h3 className="calendar-month-year">{getMonthName(currentMonth)} {currentYear}</h3>
                        <ChevronRight size={20} className="calendar-arrow" onClick={() => handleMonthChange(1)} />
                    </div>
                    <div className="calendar-weekdays">
                        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => <div key={day} className="weekday-label">{day}</div>)}
                    </div>
                    <div className="calendar-grid">
                        {renderCalendar()}
                    </div>
                </div>
            </main>

            <footer className="bottom-nav-footer">
                <div className="nav-group">
                    <div className="nav-item">
                        <BookOpen size={24} />
                        <span>일기페이지</span>
                    </div>
                    <div className="nav-item-center">
                        <div className="home-button-bubble"><Home size={32} /></div>
                    </div>
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