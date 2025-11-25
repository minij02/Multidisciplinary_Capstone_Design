import React, { useState, useEffect, useMemo } from 'react';
import { User, ChevronLeft, ChevronRight, Home, Search, BookOpen, Clock } from 'lucide-react';

// API 응답 DTO를 모방한 타입 정의
interface MainPageResponse {
    userId: number;
    userName: string;
    userEmail: string;
    totalDiaryCount: number;
    favoriteDiaryCount: number;
    // API에서 LocalDate가 YYYY-MM-DD 형식의 문자열로 전송됨
    diaryDates: string[]; 
}

const API_URL = "http://localhost:8080/api/page/main";
const API_MAX_RETRIES = 3;

/**
 * 지수 백오프를 사용한 API 호출 및 재시도 로직
 * 401 오류 해결을 위해 Authorization 헤더에 토큰을 추가합니다.
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
        // 토큰이 없으면 401 오류가 발생할 가능성이 높습니다.
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
    const names = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "GIMME", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
    return names[monthIndex % 12];
}

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

    // 일기 작성일 (YYYY-MM-DD 형식의 문자열 Set)
    const diaryDatesSet = useMemo(() => {
        return new Set(data?.diaryDates || []);
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
                
                // 401 오류 발생 시 로그인 페이지로 리디렉션 (예시)
                if (errorMessage.includes("인증되지 않은 사용자입니다.") || errorMessage.includes("인증 토큰이 만료")) {
                    // 실제 라우터 사용 시 navigate('/login') 등으로 대체
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
            days.push(<div key={`empty-${i}`} className="p-2 text-center"></div>);
        }

        // 날짜 채우기
        for (let day = 1; day <= totalDays; day++) {
            const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const hasDiary = diaryDatesSet.has(dateString);
            
            // 이미지처럼 일기가 작성된 날짜를 빨간색 배경의 동그라미로 강조
            const dayClass = hasDiary
                ? 'bg-red-500 text-white rounded-full font-bold shadow-md'
                : 'text-gray-800';
            
            // 날짜를 이미지처럼 중앙 정렬된 격자 셀에 배치
            days.push(
                <div 
                    key={day} 
                    className="flex items-center justify-center p-2 h-10 w-10 mx-auto transition duration-150 ease-in-out cursor-pointer"
                >
                    <span className={`w-8 h-8 flex items-center justify-center text-sm ${dayClass}`}>
                        {day}
                    </span>
                    {/* 이미지에 있는 아이콘 표시 (예시: L, 1, 19) - 실제 로직은 복잡하므로 간단한 플레이스홀더만 구현 */}
                    {hasDiary && day % 5 === 0 && (
                         <Clock size={12} className="absolute bottom-0 right-0 text-red-700" />
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
            <div className="flex items-center justify-center h-full min-h-screen bg-gray-50">
                <Loader2 className="h-10 w-10 text-pink-500 animate-spin" />
                <p className="ml-2 text-pink-500">데이터를 불러오는 중...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 text-center bg-red-100 text-red-700 border border-red-400 rounded-lg m-4">
                <p className="font-bold">오류 발생:</p>
                <p>{error}</p>
                {/* 401 오류 시 로그인 유도 */}
                {error.includes("인증") && (
                    <button 
                        // 실제 라우터 사용 시 onClick={() => navigate('/login')}
                        className="mt-3 px-4 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition"
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
        <div className="min-h-screen bg-gray-50 flex flex-col items-center pb-20 font-sans">
            
            {/* 1. 상단 헤더 (네비게이션) */}
            <header className="w-full flex justify-between items-center p-4 bg-white shadow-sm sticky top-0 z-10">
                <BookOpen className="text-gray-600 cursor-pointer" size={24} />
                <h1 className="text-xl font-bold text-gray-800">메인페이지</h1>
                <User className="text-gray-600 cursor-pointer" size={24} />
            </header>

            {/* 2. 메인 콘텐츠 영역 */}
            <main className="w-full max-w-md p-4 space-y-6">

                {/* 프로필 카드 */}
                <div className="flex flex-col items-center text-center p-6 bg-white rounded-xl shadow-lg">
                    <img
                        src={profileImageUrl}
                        alt="User Profile"
                        className="w-28 h-28 object-cover rounded-full border-4 border-pink-100 shadow-md"
                        onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => { 
                             e.currentTarget.onerror = null; 
                             e.currentTarget.src = 'https://placehold.co/100x100/cccccc/333333?text=User'; 
                        }}
                    />
                    <h2 className="mt-4 text-xl font-semibold text-gray-800">
                        {userName || "다학재"}'s Diary
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                        00.00.01 여자
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                        나홀로 여행을 좋아해요
                    </p>
                </div>

                {/* 통계 카드 (All / Favorite) */}
                <div className="flex w-full overflow-hidden rounded-xl shadow-lg h-24">
                    {/* All (전체 작성 일기 수) */}
                    <div className="flex-1 flex flex-col items-center justify-center bg-blue-100/50 border-r border-dashed border-gray-300">
                        <span className="text-3xl font-extrabold text-blue-800">{totalDiaryCount}</span>
                        <span className="text-sm text-gray-600 mt-1">All</span>
                    </div>
                    {/* Favorite (좋아요 일기 수) */}
                    <div className="flex-1 flex flex-col items-center justify-center bg-pink-100/50">
                        <span className="text-3xl font-extrabold text-pink-700">{favoriteDiaryCount}</span>
                        <span className="text-sm text-gray-600 mt-1">Favorite</span>
                    </div>
                </div>

                {/* 캘린더 카드 */}
                <div className="bg-white rounded-xl shadow-lg p-4">
                    {/* 달력 헤더 (이동 버튼 및 월/년) */}
                    <div className="flex justify-between items-center mb-4">
                        <ChevronLeft 
                            size={20} 
                            className="text-gray-500 cursor-pointer hover:text-gray-700" 
                            onClick={() => handleMonthChange(-1)} 
                        />
                        <h3 className="text-lg font-bold text-gray-800">
                            {getMonthName(currentMonth)} {currentYear}
                        </h3>
                        <ChevronRight 
                            size={20} 
                            className="text-gray-500 cursor-pointer hover:text-gray-700" 
                            onClick={() => handleMonthChange(1)} 
                        />
                    </div>
                    
                    {/* 요일 표시 */}
                    <div className="grid grid-cols-7 text-center text-xs font-semibold text-gray-500 mb-2">
                        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                            <div key={day} className="p-2">{day}</div>
                        ))}
                    </div>

                    {/* 날짜 그리드 */}
                    <div className="grid grid-cols-7 gap-y-2">
                        {renderCalendar()}
                    </div>
                </div>

            </main>

            {/* 3. 하단 네비게이션 */}
            <footer className="fixed bottom-0 w-full max-w-md bg-white shadow-2xl rounded-t-xl border-t border-gray-100">
                <div className="flex justify-around items-center h-16">
                    {/* 일기 페이지 (BookOpen) */}
                    <div className="flex flex-col items-center text-sm text-gray-500 cursor-pointer hover:text-pink-500 transition-colors">
                        <BookOpen size={24} />
                        <span>일기페이지</span>
                    </div>
                    
                    {/* 홈 버튼 (가운데 큰 버튼) */}
                    <div className="transform -translate-y-4">
                        <div className="bg-pink-500 p-3 rounded-full shadow-lg cursor-pointer hover:bg-pink-600 transition-colors">
                            <Home size={32} className="text-white" />
                        </div>
                    </div>

                    {/* 마이 페이지 (Search) */}
                    <div className="flex flex-col items-center text-sm text-gray-500 cursor-pointer hover:text-pink-500 transition-colors">
                        <Search size={24} />
                        <span>마이페이지</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

// Loader2 아이콘 정의 (lucide-react에서 가져온다고 가정)
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

export default MainPage;