import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Send, BookOpen, Search, Home, Loader2, Clock, Edit2 } from 'lucide-react';
import './DiaryPage.css';

// -----------------------------------------------------------------------------
// Types & API Logic (기존과 동일)
// -----------------------------------------------------------------------------
interface EntryListItem {
    entryId: number;
    subtitle: string | null;
    createdTime: string; 
}

interface ChapterList {
    chapterId: number;
    title: string;
    coverImageUrl: string;
    travelPeriod: string;
    entries: EntryListItem[];
}

const API_BASE_URL = "http://localhost:8080/api/chapters"; 
const API_MAX_RETRIES = 3;

const formatTimeAgo = (isoString: string): string => {
    if (!isoString) return '';
    const now = new Date();
    const past = new Date(isoString);
    const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / (1000 * 60));
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
};

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
            { entryId: 104, subtitle: "신주쿠 공원에서의 산책", createdTime: new Date(Date.now() - 12000000).toISOString() },
            { entryId: 105, subtitle: "마지막 날, 아쉬움을 뒤로하고", createdTime: new Date(Date.now() - 14000000).toISOString() },
        ]
    },
     {
        chapterId: 2,
        title: "제주도 푸른 밤, 2박 3일",
        coverImageUrl: "",
        travelPeriod: "2024.08.01 ~ 2024.08.03",
        entries: [
            { entryId: 201, subtitle: "함덕 해변의 잔잔한 파도 소리", createdTime: new Date(Date.now() - 86400000 * 30).toISOString() },
            { entryId: 202, subtitle: "우도에서의 전기차 드라이브", createdTime: new Date(Date.now() - 86400000 * 30).toISOString() },
             { entryId: 203, subtitle: "성산일출봉 일출 보기", createdTime: new Date(Date.now() - 86400000 * 30).toISOString() },
        ]
    }
];

const DiaryPage: React.FC = () => {
    const [chapters, setChapters] = useState<ChapterList[]>([]);
    const [loading, setLoading] = useState(true); 
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const fetchChapterList = useCallback(async (): Promise<ChapterList[]> => {
        const token = localStorage.getItem('accessToken');
        if (!token) throw new Error("AUTH_REQUIRED"); 
        
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        };
        
        let lastError = null;
        for (let i = 0; i < API_MAX_RETRIES; i++) {
            try {
                const response = await fetch(`${API_BASE_URL}/list`, { headers });
                if (response.ok) return await response.json();
                if (response.status === 401 || response.status === 403) throw new Error("AUTH_EXPIRED");
                throw new Error(`서버 오류: ${response.status}`);
            } catch (err) {
                lastError = err;
                if (err instanceof Error && (err.message.includes("AUTH"))) throw lastError;
                if (i === API_MAX_RETRIES - 1) throw lastError;
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        throw new Error("API 오류");
    }, []); 

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const data = await fetchChapterList();
                setChapters(data);
            } catch (err) {
                console.error("API Fail, Load Mock");
                setChapters(MOCK_CHAPTERS); 
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [fetchChapterList]);

    // [핸들러] 챕터에 새 일기 추가하기 버튼 클릭
    const handleAddEntryToChapter = (chapter: ChapterList) => {
        // 모든 챕터 속성을 state에 담아 DiaryWrite로 전달 (초기값으로 사용)
        navigate('/diary/write', {
            state: {
                chapterId: chapter.chapterId,     
                diaryTitle: chapter.title, // 챕터 제목을 일기 제목의 힌트로 사용
                arrivalCity: chapter.title.split(',').pop()?.trim() || '도착지', // 예시 파싱
                startDate: chapter.travelPeriod.split(' ~ ')[0]?.trim(), 
                endDate: chapter.travelPeriod.split(' ~ ')[1]?.trim(), 
                // DB에서 받아온 tripNights, tripDays, totalCost 등의 정보도 여기에 추가해야 완벽함
                // 현재 Mock Data는 해당 필드를 가지지 않아 임시로 생략
            }
        });
    };

    if (loading) {
        return (
            <div className="diary-page-container">
                {/* 로컬에서는 아래 style 태그 제거하고 CSS 파일 import 하세요 */}
                <div className="loading-container">
                    <Loader2 className="loader-icon" size={40} />
                    <p className="loading-text">이야기를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    const currentChapter = chapters.length > 0 ? chapters[0] : null;

    return (
        <div className="diary-page-container">
             {/* 로컬에서는 아래 style 태그 제거 */}

            {/* 1. 상단 헤더 (고정됨) */}
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

            {/* 2. 스크롤 가능한 중간 영역 */}
            <div className="diary-scroll-area">
                {currentChapter && (
                    <div className="current-chapter-wrapper">
                        <div className="current-chapter-card">
                            <p className="chapter-subtitle">현재 진행하고 있는 챕터</p>
                            <div className="chapter-card-content">
                                <h2 className="chapter-title">Chapter 1: {currentChapter.title}</h2>
                                 {/* 챕터 카드 클릭 시 해당 챕터에 바로 일기 추가 페이지로 이동 */}
                                <Send 
                                    className="card-action-icon" 
                                    size={20} 
                                    onClick={() => handleAddEntryToChapter(currentChapter)}
                                />
                            </div>
                        </div>
                    </div>
                )}

                <main className="timeline-main">
                    {chapters.map((chapter, index) => (
                        <div key={chapter.chapterId} className="timeline-chapter-group">
                            <h2 className="chapter-group-title">
                                Chapter {index + 1}: {chapter.title}
                                <span className="travel-period">{chapter.travelPeriod}</span>
                            </h2>

                            <div className="timeline-entries-container">
                                <div className="timeline-line"></div>

                                {chapter.entries.map((entry, entryIndex) => (
                                    <div key={entry.entryId} className="timeline-entry">
                                        <div className="timeline-dot"></div>
                                        <div 
                                            className="entry-card"
                                            onClick={() => navigate(`/diary/${entry.entryId}`)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <h3 className="entry-title">
                                                Chapter {index + 1}.{entryIndex + 1}
                                            </h3>
                                            <p className="entry-subtitle">{entry.subtitle || "제목 없음"}</p>
                                            
                                            <div className="entry-meta">
                                                <Clock size={12} className="entry-meta-icon" />
                                                <span>{formatTimeAgo(entry.createdTime)}</span>
                                                
                                                {entry.subtitle && entry.subtitle.includes("작성하지 않은") && (
                                                    <Edit2 size={12} className="entry-meta-icon edit-icon" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* ★★★ [추가됨] 타임라인 마지막에 '새 글 쓰기' 버튼 추가 ★★★ */}
                                <div className="timeline-entry">
                                    <div className="timeline-dot" style={{ borderColor: '#9ca3af', backgroundColor: '#f3f4f6' }}></div>
                                    <div 
                                        className="entry-card"
                                        onClick={() => handleAddEntryToChapter(chapter)}
                                        style={{ 
                                            cursor: 'pointer', 
                                            border: '2px dashed #e5e7eb', 
                                            boxShadow: 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '12px',
                                            color: '#9ca3af'
                                        }}
                                    >
                                        <span style={{ fontSize: '14px', fontWeight: 600 }}>+ 이 챕터에 일기 추가하기</span>
                                    </div>
                                </div>

                            </div>
                        </div>
                    ))}
                </main>
            </div>

            {/* 3. 하단 네비게이션 (고정됨) */}
            <footer className="bottom-nav-footer">
                <div className="nav-group">
                    <div className="nav-item nav-item-active" onClick={() => navigate('/diary')}>
                        <BookOpen size={24} />
                        <span>일기페이지</span>
                    </div>
                    <div className="nav-item-center" onClick={() => navigate('/main')}>
                        <div className="home-button-bubble">
                            <Home size={32} className="home-icon" />
                        </div>
                    </div>
                    <div className="nav-item" onClick={() => navigate('/mypage')}>
                        <Search size={24} />
                        <span>마이페이지</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default DiaryPage;