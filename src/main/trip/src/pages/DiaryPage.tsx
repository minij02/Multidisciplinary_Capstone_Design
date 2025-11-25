import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Send, BookOpen, Search, Home, Loader2, Clock, Edit2 } from 'lucide-react';

// ====================================================================
// 1. 프론트엔드용 DTO 인터페이스 정의
// ====================================================================

// 백엔드의 EntryListItemResponse를 모방
interface EntryListItem {
    entryId: number;
    subtitle: string;
    // 백엔드가 LocalDateTime을 ISO 8601 문자열로 보낸다고 가정
    createdTime: string; 
}

// 백엔드의 ChapterListResponse를 모방
interface ChapterList {
    chapterId: number;
    title: string;
    coverImageUrl: string;
    travelPeriod: string;
    entries: EntryListItem[];
}

// ====================================================================
// 2. API 상수 및 호출 로직 (페이지 컴포넌트 내부 통합)
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


const DiaryPage: React.FC = () => {
    const [chapters, setChapters] = useState<ChapterList[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    // API 호출 로직을 useCallback으로 감싸 안정성 확보
    const fetchChapterList = useCallback(async (): Promise<ChapterList[]> => {
        const token = localStorage.getItem('accessToken');
        
        if (!token) {
            console.error("인증 토큰을 찾을 수 없습니다.");
            throw new Error("AUTH_REQUIRED"); 
        }
        
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`, // JWT 토큰 사용
        };
        
        let lastError = null;
        for (let i = 0; i < API_MAX_RETRIES; i++) {
            try {
                const response = await fetch(`${API_BASE_URL}/list`, {
                    headers: headers,
                });

                if (response.ok) {
                    return await response.json();
                } else if (response.status === 401 || response.status === 403) {
                    throw new Error("AUTH_EXPIRED"); 
                } else {
                    throw new Error(`서버 오류: ${response.status} ${response.statusText}`);
                }
            } catch (err) {
                lastError = err;
                if (i === API_MAX_RETRIES - 1) {
                    throw lastError;
                }
                // 인증 오류가 아니면 지수 백오프로 재시도
                const isAuthError = err instanceof Error && (err.message.includes("AUTH_EXPIRED") || err.message.includes("AUTH_REQUIRED"));
                if (!isAuthError) {
                    console.warn(`API 호출 실패, 재시도 중... (시도 ${i + 1})`);
                    const delay = Math.pow(2, i) * 1000 + Math.random() * 500;
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    throw lastError;
                }
            }
        }
        // 이 코드는 보통 도달하지 않지만, 타입 안전성을 위해 추가
        throw new Error("알 수 없는 API 호출 오류");
    }, []); // 의존성 없음

    // ====================================================================
    // 3. 데이터 로딩 이펙트
    // ====================================================================
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await fetchChapterList();
                setChapters(data);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
                setError(errorMessage);
                
                // 401 오류 시 로그인 페이지로 리디렉션
                if (errorMessage.includes("AUTH_REQUIRED") || errorMessage.includes("AUTH_EXPIRED")) {
                    console.log("인증 실패, 로그인 페이지로 이동");
                    // 실제 라우터 사용 시 navigate('/login') 주석 해제
                    // navigate('/login'); 
                }
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [fetchChapterList, navigate]);


    // ====================================================================
    // 4. 로딩 및 에러 뷰 렌더링
    // ====================================================================

    const renderLoading = () => (
        <div className="flex items-center justify-center h-full min-h-[50vh] text-pink-500">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <p>이야기를 불러오는 중...</p>
        </div>
    );

    const renderError = () => (
        <div className="p-4 text-center bg-red-100 text-red-700 border border-red-400 rounded-lg m-4">
            <p className="font-bold">데이터 로드 오류:</p>
            <p>{error}</p>
            <button 
                onClick={() => navigate('/login')}
                className="mt-3 px-4 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition"
            >
                다시 로그인하기
            </button>
        </div>
    );

    if (loading) return renderLoading();
    if (error) return renderError();

    // 현재 진행 중인 챕터 (예시로 첫 번째 챕터 사용)
    const currentChapter = chapters.length > 0 ? chapters[0] : null;

    // ====================================================================
    // 5. 메인 UI 렌더링
    // ====================================================================
    return (
        <div className="min-h-screen bg-white flex flex-col items-center">
            {/* 1. 상단 헤더 */}
            <header className="w-full max-w-md flex flex-col p-4 pt-10 sticky top-0 bg-white z-10 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <p className="text-gray-600">또 와주셔서 감사해요. 여행자님.</p>
                    <User className="text-gray-600 cursor-pointer" size={24} />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-6">
                    당신의 이야기가 궁금해요.
                    <BookOpen className="inline ml-1 text-pink-500" size={24} />
                </h1>
            </header>

            {/* 2. 현재 진행중인 챕터 카드 */}
            {currentChapter && (
                <div className="w-full max-w-md px-4 mb-8">
                    <div className="p-4 bg-blue-50 rounded-xl shadow-lg relative overflow-hidden">
                        <div className="absolute inset-0 opacity-20">
                            {/* 

[Image of minimalistic globe and geometric shapes]
 */}
                        </div>
                        <p className="text-sm text-gray-600 relative z-10">현재 진행하고 있는 챕터</p>
                        <div className="flex justify-between items-center mt-2 relative z-10">
                            <h2 className="text-lg font-semibold text-gray-800">
                                Chapter 1: {currentChapter.title}
                            </h2>
                            <Send className="text-pink-500 cursor-pointer" size={20} />
                        </div>
                    </div>
                </div>
            )}

            {/* 3. 전체 챕터 및 일기 목록 타임라인 */}
            <main className="w-full max-w-md px-4 space-y-8">
                {chapters.map((chapter, index) => (
                    <div key={chapter.chapterId} className="relative pb-8">
                        {/* 챕터 타이틀 */}
                        <h2 className="text-xl font-bold text-gray-800 mb-4 ml-4">
                            Chapter {index + 1}: {chapter.title}
                        </h2>

                        {/* 일기 항목 목록 (타임라인) */}
                        <div className="relative">
                            {/* 타임라인 선 */}
                            <div className="absolute left-[30px] top-0 bottom-0 w-0.5 bg-gray-200"></div>

                            {chapter.entries.map((entry, entryIndex) => (
                                <div key={entry.entryId} className="flex items-start mb-6">
                                    {/* 점 */}
                                    <div className="relative z-10 w-4 h-4 rounded-full bg-white border-2 border-gray-400 mt-2 flex-shrink-0 ml-[23px]"></div>

                                    {/* 일기 카드 */}
                                    <div className="flex-1 ml-6 p-4 bg-white rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                                        <h3 className="text-base font-semibold text-gray-800">
                                            chapter {index + 1}.{entryIndex + 1}
                                        </h3>
                                        {/* 이미지의 '놀러와서 일기 작성하기' 부분을 모방 */}
                                        <p className="text-gray-600 mt-1">{entry.subtitle}</p>
                                        
                                        <div className="flex items-center text-xs text-gray-400 mt-2">
                                            {/* 이미지에서 '36 minutes ago' 형식으로 표시된 부분을 구현 */}
                                            <Clock size={12} className="mr-1" />
                                            <span>{formatTimeAgo(entry.createdTime)}</span>
                                            
                                            {/* 이미지처럼 펜 모양 아이콘 추가 */}
                                            {entry.subtitle.includes("작성하기") && <Edit2 size={12} className="ml-3" />}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

            </main>

            {/* 4. 하단 네비게이션 */}
            <footer className="fixed bottom-0 w-full max-w-md bg-white shadow-2xl rounded-t-xl border-t border-gray-100">
                <div className="flex justify-around items-center h-16">
                    <div className="flex flex-col items-center text-sm text-pink-600 cursor-pointer transition-colors">
                        <BookOpen size={24} />
                        <span>일기페이지</span>
                    </div>
                    
                    <div className="transform -translate-y-4" onClick={() => navigate('/main')}>
                        <div className="bg-pink-500 p-3 rounded-full shadow-lg cursor-pointer hover:bg-pink-600 transition-colors">
                            <Home size={32} className="text-white" />
                        </div>
                    </div>

                    <div className="flex flex-col items-center text-sm text-gray-500 cursor-pointer hover:text-pink-500 transition-colors" onClick={() => console.log('마이페이지 이동')}>
                        <Search size={24} />
                        <span>마이페이지</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default DiaryPage;