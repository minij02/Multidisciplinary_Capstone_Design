import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Send, BookOpen, Search, Home, Loader2, Clock, Edit2 } from 'lucide-react';
import './DiaryPage.css';

// ====================================================================
// 1. 프론트엔드용 DTO 인터페이스 정의
// ====================================================================

interface EntryListItem {
    entryId: number;
    subtitle: string;
    createdTime: string; 
}

interface ChapterList {
    chapterId: number;
    title: string;
    coverImageUrl: string;
    travelPeriod: string;
    entries: EntryListItem[];
}

// ====================================================================
// 2. API 상수 및 호출 로직
// ====================================================================

const API_BASE_URL = "http://localhost:8080/api/chapters"; 
const API_MAX_RETRIES = 3;

/**
 * ISO 8601 문자열을 'X minutes/hours/days ago' 형식으로 변환하는 헬퍼 함수
 */
const formatTimeAgo = (isoString: string): string => {
    const now = new Date();
    const past = new Date(isoString);
    const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
        return `${diffInMinutes} minutes ago`;
    }
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours} hours ago`;
    }
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
};

// --------------------------------------------------------------------
// ⭐ MOCK DATA 정의 (실패 시 대체용) ⭐
// --------------------------------------------------------------------
const MOCK_CHAPTERS: ChapterList[] = [
    {
        chapterId: 1,
        title: "낯선 공기와 설렘, 도쿄 3박 4일",
        coverImageUrl: "",
        travelPeriod: "2024.10.15 ~ 2024.10.18",
        entries: [
            { entryId: 101, subtitle: "도쿄 하네다 공항 도착, 설레는 첫날", createdTime: new Date(Date.now() - 3600000).toISOString() },
            { entryId: 102, subtitle: "시부야 스크램블 교차로와 맛집 탐방", createdTime: new Date(Date.now() - 7200000).toISOString() },
            { entryId: 103, subtitle: "새 일기 항목 작성하기", createdTime: new Date(Date.now() - 10800000).toISOString() },
        ]
    },
    {
        chapterId: 2,
        title: "제주도 푸른 밤, 가족과 함께 2박 3일",
        coverImageUrl: "",
        travelPeriod: "2024.08.01 ~ 2024.08.03",
        entries: [
            { entryId: 201, subtitle: "함덕 해변의 잔잔한 파도 소리", createdTime: new Date(Date.now() - 86400000 * 30).toISOString() },
        ]
    }
];
// --------------------------------------------------------------------


const DiaryPage: React.FC = () => {
    // ⭐ 초기 상태 변경: 빈 배열, 로딩 시작 ⭐
    const [chapters, setChapters] = useState<ChapterList[]>([]);
    const [loading, setLoading] = useState(true); 
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    // API 호출 로직 (인증 및 재시도 포함)
    const fetchChapterList = useCallback(async (): Promise<ChapterList[]> => {
        
        const token = localStorage.getItem('accessToken');
        
        if (!token) {
            // 토큰이 없으면 로그인 필요 오류를 던집니다.
            throw new Error("AUTH_REQUIRED"); 
        }
        
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`, // JWT 토큰 사용
        };
        
        let lastError = null;
        for (let i = 0; i < API_MAX_RETRIES; i++) {
            try {
                // ⭐ 실제 API 호출 ⭐
                const response = await fetch(`${API_BASE_URL}/list`, {
                    headers: headers,
                });

                if (response.ok) {
                    return await response.json();
                } else if (response.status === 401 || response.status === 403) {
                    // 인증/인가 실패 시
                    throw new Error("AUTH_EXPIRED"); 
                } else {
                    throw new Error(`서버 오류: ${response.status} ${response.statusText}`);
                }
            } catch (err) {
                lastError = err;
                if (err instanceof Error && (err.message.includes("AUTH_EXPIRED") || err.message.includes("AUTH_REQUIRED"))) {
                     // 인증 오류는 재시도 없이 즉시 종료
                    throw lastError;
                }
                
                // 서버 오류 시 재시도 로직
                if (i === API_MAX_RETRIES - 1) {
                    throw lastError;
                }
                console.warn(`API 호출 실패, 재시도 중... (시도 ${i + 1})`);
                const delay = Math.pow(2, i) * 1000 + Math.random() * 500;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        throw new Error("알 수 없는 API 호출 오류");
    }, []); 

    // --- 데이터 로딩 이펙트 (활성화) ---
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await fetchChapterList();
                setChapters(data);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
                
                // ⭐ API 실패 시 Mock Data 로드 ⭐
                console.error("API 호출 최종 실패, Mock Data 로드:", errorMessage);
                setChapters(MOCK_CHAPTERS); 
                setError(errorMessage); 

                if (errorMessage.includes("AUTH_REQUIRED") || errorMessage.includes("AUTH_EXPIRED")) {
                    console.log("인증 실패, 로그인 페이지로 이동");
                    // navigate('/login'); // 실제 환경에서는 로그인 페이지로 리디렉션
                }
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [fetchChapterList, navigate]);


    // ====================================================================
    // 4. 로딩 및 에러 뷰 렌더링 (하단 UI는 이전과 동일)
    // ====================================================================
    // ... (renderLoading, renderError 함수는 기존과 동일) ...

    const renderLoading = () => (
        <div className="loading-container">
            <Loader2 className="loader-icon" size={40} />
            <p className="loading-text">이야기를 불러오는 중...</p>
        </div>
    );

    const renderError = () => (
        <div className="error-container">
            <p className="error-title">데이터 로드 오류:</p>
            <p className="error-message">{error}</p>
            <button 
                onClick={() => navigate('/login')}
                className="login-button"
            >
                다시 로그인하기
            </button>
        </div>
    );

    // 현재는 API 실패 시에도 Mock Data를 로드하므로, error 상태일 때는 에러 메시지만 보여줍니다.
    if (loading) return renderLoading();
    // if (error) return renderError(); // Mock Data를 보여주기 위해 에러 뷰는 주석 처리하거나, 에러가 발생하면 Mock Data를 보여주는 방식으로 변경

    // 현재 진행 중인 챕터 (예시로 첫 번째 챕터 사용)
    const currentChapter = chapters.length > 0 ? chapters[0] : null;

    // ====================================================================
    // 5. 메인 UI 렌더링 (나머지 UI 코드는 기존과 동일하게 유지)
    // ====================================================================
    return (
        <div className="diary-page-container">
            {/* ... (상단 헤더 및 챕터 카드, 타임라인 렌더링 UI 코드 유지) ... */}
            <header className="header-area">
                <div className="header-top-bar">
                    <p className="header-greeting">또 와주셔서 감사해요. 여행자님.</p>
                    <User className="nav-icon" size={24} />
                </div>
                <h1 className="header-title">
                    당신의 이야기가 궁금해요.
                    <BookOpen className="header-title-icon" size={24} />
                </h1>
            </header>

            {/* 2. 현재 진행중인 챕터 카드 */}
            {currentChapter && (
                <div className="current-chapter-wrapper">
                    <div className="current-chapter-card">
                        <div className="chapter-card-bg-effect">
                            {/* 미니멀한 지구본/기하학적 도형 이미지를 CSS로 표현하거나 인라인 SVG를 사용 */}
                        </div>
                        <p className="chapter-subtitle">현재 진행하고 있는 챕터</p>
                        <div className="chapter-card-content">
                            <h2 className="chapter-title">
                                Chapter 1: {currentChapter.title}
                            </h2>
                            <Send className="card-action-icon" size={20} />
                        </div>
                    </div>
                </div>
            )}

            {/* 3. 전체 챕터 및 일기 목록 타임라인 */}
            <main className="timeline-main">
                {chapters.map((chapter, index) => (
                    <div key={chapter.chapterId} className="timeline-chapter-group">
                        {/* 챕터 타이틀 */}
                        <h2 className="chapter-group-title">
                            Chapter {index + 1}: {chapter.title}
                            <span className="travel-period">{chapter.travelPeriod}</span>
                        </h2>

                        {/* 일기 항목 목록 (타임라인) */}
                        <div className="timeline-entries-container">
                            {/* 타임라인 선 */}
                            <div className="timeline-line"></div>

                            {chapter.entries.map((entry, entryIndex) => (
                                <div key={entry.entryId} className="timeline-entry">
                                    {/* 점 */}
                                    <div className="timeline-dot"></div>

                                    {/* 일기 카드 */}
                                    <div className="entry-card">
                                        <h3 className="entry-title">
                                            Chapter {index + 1}.{entryIndex + 1}
                                        </h3>
                                        <p className="entry-subtitle">{entry.subtitle}</p>
                                        
                                        <div className="entry-meta">
                                            <Clock size={12} className="entry-meta-icon" />
                                            <span>{formatTimeAgo(entry.createdTime)}</span>
                                            
                                            {/* '작성하기' 항목에만 펜 모양 아이콘 추가 */}
                                            {entry.subtitle.includes("작성하지 않은") && <Edit2 size={12} className="entry-meta-icon edit-icon" />}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </main>

            {/* 4. 하단 네비게이션 (MainPage에서 사용한 스타일 재활용) */}
            <footer className="bottom-nav-footer">
                <div className="nav-group">
                    {/* 일기 페이지 (활성화) */}
                    <div className="nav-item nav-item-active">
                        <BookOpen size={24} />
                        <span>일기페이지</span>
                    </div>
                    
                    {/* 홈 버튼 (가운데 큰 버튼) */}
                    <div className="nav-item-center" onClick={() => navigate('/main')}>
                        <div className="home-button-bubble">
                            <Home size={32} className="home-icon" />
                        </div>
                    </div>

                    {/* 마이 페이지 */}
                    <div className="nav-item" onClick={() => console.log('마이페이지 이동')}>
                        <Search size={24} />
                        <span>마이페이지</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default DiaryPage;