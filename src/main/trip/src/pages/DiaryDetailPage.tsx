import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, MessageCircle } from 'lucide-react';

// -----------------------------------------------------------------------------
// 1. CSS Styles (단일 파일 실행을 위해 내부에 포함)
// -----------------------------------------------------------------------------
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300;400;600&display=swap');

  * { box-sizing: border-box; }
  body { margin: 0; padding: 0; font-family: 'Noto Serif KR', serif; background-color: #f0f0f0; }

  .diary-detail-container {
    width: 100%; min-width: 360px; max-width: 480px; margin: 0 auto;
    background-color: #f7f7f7; height: 100vh; display: flex; flex-direction: column;
    position: relative; overflow: hidden;
  }

  .detail-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 16px 20px; background-color: transparent; z-index: 10;
  }
  .header-title { font-size: 16px; font-weight: 500; color: #333; }
  .icon-btn { background: none; border: none; cursor: pointer; padding: 0; }
  .text-btn { background: none; border: none; font-size: 14px; color: #666; cursor: pointer; font-family: inherit; }

  .detail-content {
    flex: 1; overflow-y: auto; padding: 0 24px 80px 24px;
    scrollbar-width: none;
  }
  .detail-content::-webkit-scrollbar { display: none; }

  .chapter-info { margin-top: 10px; margin-bottom: 20px; }
  .chapter-date { display: block; font-size: 12px; color: #888; margin-bottom: 4px; }
  .chapter-title { font-size: 18px; font-weight: 600; color: #111; margin: 0; }

  .image-wrapper {
    width: 100%; height: 300px; border-radius: 140px 140px 0 0;
    overflow: hidden; margin-bottom: 24px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);
    background-color: #e0e0e0; position: relative;
  }
  .image-wrapper.placeholder { display: flex; align-items: center; justify-content: center; color: #888; }
  .diary-main-image { width: 100%; height: 100%; object-fit: cover; }

  .diary-subtitle { font-size: 20px; font-weight: 700; margin-bottom: 16px; color: #222; line-height: 1.4; }
  .diary-text { font-size: 15px; line-height: 1.8; color: #444; text-align: justify; margin-bottom: 30px; white-space: pre-line; }

  .ai-comment-section {
    font-size: 14px; color: #555; background-color: #fff; padding: 20px;
    border-radius: 12px; line-height: 1.6; box-shadow: 0 2px 8px rgba(0,0,0,0.03); margin-bottom: 20px;
  }

  .detail-footer {
    position: absolute; bottom: 30px; left: 0; width: 100%;
    display: flex; justify-content: center; pointer-events: none;
  }
  .chat-action-btn {
    pointer-events: auto; display: flex; align-items: center; gap: 8px;
    background-color: rgba(255, 255, 255, 0.9); backdrop-filter: blur(4px);
    border: 1px solid #ddd; padding: 10px 20px; border-radius: 30px;
    font-size: 14px; font-weight: 600; color: #333; cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1); transition: transform 0.2s;
  }
  .chat-action-btn:active { transform: scale(0.95); }

  /* 로딩 및 에러 화면 스타일 */
  .loading-screen, .error-screen {
    display: flex; flex-direction: column; justify-content: center; align-items: center;
    height: 100vh; width: 100%; font-size: 16px; color: #666; gap: 10px; background-color: #f7f7f7;
    position: absolute; top: 0; left: 0; z-index: 50; text-align: center;
  }
  
  .retry-btn {
    margin-top: 10px; padding: 8px 16px; background-color: #333; color: white;
    border: none; border-radius: 20px; cursor: pointer;
  }
`;

// -----------------------------------------------------------------------------
// 2. Types & Interfaces
// -----------------------------------------------------------------------------
interface DiaryDetailResponse {
    entryId: number;
    date: string;
    subtitle: string;
    content: string;
    creationMethod: string;
    mediaUrls: string[];
    chapterId: number;
    chapterTitle: string;
    chapterCreationTime: string;
}

const API_URL_BASE = "http://localhost:8080/api/diary";

// -----------------------------------------------------------------------------
// 3. Component
// -----------------------------------------------------------------------------
const DiaryDetailPage: React.FC = () => {
    const { entryId } = useParams<{ entryId: string }>();
    const navigate = useNavigate();
    
    const [diary, setDiary] = useState<DiaryDetailResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 더미 데이터 로드 함수 (API 실패 시 사용)
    const loadMockData = () => {
        console.log("Loading mock data...");
        setDiary({
            entryId: Number(entryId) || 1,
            date: "2024-10-01",
            subtitle: "나리타 공항 도착과 첫 라멘 (Mock Data)",
            content: "API 연결에 실패하여 더미 데이터를 보여줍니다.\n\n비행기에서 내리자마자 느껴지는 습한 공기.\n숙소에 짐을 풀기도 전에 근처 라멘집으로 달려갔다.\n진한 돈코츠 육수가 여행의 시작을 알렸다.",
            creationMethod: "manual",
            mediaUrls: ["https://images.unsplash.com/photo-1552611052-33e04de081de?q=80&w=1000&auto=format&fit=crop"],
            chapterId: 101,
            chapterTitle: "도쿄, 맛있는 휴식",
            chapterCreationTime: "2024-10-01T10:00:00"
        });
        setLoading(false);
        setError(null);
    };

    useEffect(() => {
        // 데이터 요청 함수
        const fetchDiaryDetail = async () => {
            setLoading(true);
            setError(null);
            
            // 5초 타임아웃 설정 (백엔드가 응답 없을 경우 대비)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            try {
                const token = localStorage.getItem('accessToken');
                
                // 1. 토큰이 없으면 바로 더미 데이터 로드 (개발 편의성)
                if (!token) {
                    console.warn("[DiaryDetail] No token found. Loading mock data.");
                    clearTimeout(timeoutId);
                    // 약간의 딜레이 후 목데이터 로드 (로딩 화면 확인용)
                    setTimeout(loadMockData, 500);
                    return;
                }

                console.log(`Fetching diary detail for ID: ${entryId}...`);
                
                // 2. API 호출
                const response = await fetch(`${API_URL_BASE}/${entryId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    signal: controller.signal, // 타임아웃 연결
                });

                clearTimeout(timeoutId);

                if (response.ok) {
                    const data = await response.json();
                    console.log("Fetch success:", data);
                    setDiary(data);
                    setLoading(false);
                } else if (response.status === 403) {
                    throw new Error("접근 권한이 없습니다 (403).");
                } else if (response.status === 404) {
                    throw new Error("일기를 찾을 수 없습니다 (404).");
                } else {
                    throw new Error(`서버 오류 발생 (${response.status})`);
                }
            } catch (err: any) {
                clearTimeout(timeoutId);
                console.error("Fetch error:", err);
                
                let msg = "알 수 없는 오류가 발생했습니다.";
                if (err.name === 'AbortError') {
                    msg = "서버 응답 시간이 초과되었습니다.";
                } else if (err instanceof Error) {
                    msg = err.message;
                }
                
                setError(msg);
                setLoading(false);
            }
        };

        if (entryId) {
            fetchDiaryDetail();
        } else {
            setError("잘못된 접근입니다 (Entry ID 누락).");
            setLoading(false);
        }
    }, [entryId]);

    // -------------------------------------------------------------------------
    // 렌더링
    // -------------------------------------------------------------------------

    if (loading) {
        return (
            <div className="diary-detail-container">
                <style>{styles}</style>
                <div className="loading-screen">
                    <div style={{ marginBottom: '10px' }}>⏳</div>
                    <div>로딩 중입니다...</div>
                </div>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="diary-detail-container">
                <style>{styles}</style>
                <div className="error-screen">
                    <p style={{ fontWeight: 'bold', color: '#d32f2f' }}>오류 발생</p>
                    <p>{error}</p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="retry-btn" onClick={() => navigate(-1)}>
                            뒤로가기
                        </button>
                        <button className="retry-btn" onClick={loadMockData} style={{ backgroundColor: '#666' }}>
                            더미 데이터로 보기
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!diary) return null;

    return (
        <div className="diary-detail-container">
            <style>{styles}</style>

            {/* 1. 헤더 영역 */}
            <header className="detail-header">
                <button className="icon-btn" onClick={() => navigate(-1)}>
                    <ChevronLeft size={24} color="#333" />
                </button>
                <h1 className="header-title">Detail Chapter</h1>
                <button className="text-btn">수정하기</button>
            </header>

            {/* 2. 스크롤 가능한 본문 영역 */}
            <main className="detail-content">
                <div className="chapter-info">
                    <span className="chapter-date">{diary.date}</span>
                    <h2 className="chapter-title">{diary.chapterTitle}</h2>
                </div>

                {/* 이미지 영역: 이미지가 없거나 로드 실패 시 플레이스홀더 표시 */}
                {diary.mediaUrls && diary.mediaUrls.length > 0 ? (
                    <div className="image-wrapper">
                        <img 
                            src={diary.mediaUrls[0]} 
                            alt="Diary memory" 
                            className="diary-main-image"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none'; // 이미지 숨김
                                // 부모 요소에 '이미지 없음' 텍스트 추가하는 로직은 복잡하므로 
                                // 간단히 placeholder 스타일을 적용하거나 대체 이미지를 넣음
                                e.currentTarget.src = "https://placehold.co/600x400/e0e0e0/888888?text=No+Image";
                                e.currentTarget.style.display = 'block';
                            }}
                        />
                    </div>
                ) : (
                    <div className="image-wrapper placeholder">
                        <span>이미지 없음</span>
                    </div>
                )}

                <h3 className="diary-subtitle">{diary.subtitle}</h3>

                <div className="diary-text">
                    {(diary.content || '').split('\n').map((line, index) => (
                        <React.Fragment key={index}>
                            {line}
                            <br />
                        </React.Fragment>
                    ))}
                </div>

                <div className="ai-comment-section">
                    <p>
                        AI가 내 목소리에서 '설렘'과 '벅참'을 정확히 찾아낸 것 같아 신기하다. 
                        앞으로의 여행도 이렇게 음성으로 남겨두면, AI가 나만의 특별한 여행기를 완성해 줄 거란 기대감이 든다.
                    </p>
                </div>
            </main>

            {/* 3. 하단 액션 버튼 */}
            <footer className="detail-footer">
                <button className="chat-action-btn">
                    <MessageCircle size={18} />
                    <span>다시 채팅하기</span>
                </button>
            </footer>
        </div>
    );
};

export default DiaryDetailPage;