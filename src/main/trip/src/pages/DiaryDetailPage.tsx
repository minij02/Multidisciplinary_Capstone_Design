import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, MessageCircle, MoreHorizontal } from 'lucide-react';
import './DiaryDetailPage.css';

// API 응답 DTO 정의 (Java Controller의 DiaryDetailResponse와 일치)
interface DiaryDetailResponse {
    entryId: number;
    date: string;          // "2023-10-23"
    subtitle: string;      // "도쿄타워, 여행의 시작" (소제목)
    content: string;       // 본문 내용
    creationMethod: string;
    mediaUrls: string[];   // 첨부 파일 URL 목록
    chapterId: number;
    chapterTitle: string;  // "도쿄에서의 첫날" (챕터 제목)
    chapterCreationTime: string;
}

const DiaryDetailPage: React.FC = () => {
    const { entryId } = useParams<{ entryId: string }>(); // URL 파라미터 추출
    const navigate = useNavigate();
    
    const [diary, setDiary] = useState<DiaryDetailResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // API 호출
    useEffect(() => {
        const fetchDiaryDetail = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                if (!token) throw new Error("로그인이 필요합니다.");

                const response = await fetch(`http://localhost:8080/api/diary/${entryId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setDiary(data);
                } else if (response.status === 403) {
                    throw new Error("접근 권한이 없습니다.");
                } else {
                    throw new Error("일기를 불러오는데 실패했습니다.");
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "알 수 없는 오류");
            } finally {
                setLoading(false);
            }
        };

        if (entryId) {
            fetchDiaryDetail();
        }
    }, [entryId]);

    if (loading) return <div className="loading-screen">로딩 중...</div>;
    if (error) return <div className="error-screen">{error} <button onClick={() => navigate(-1)}>뒤로가기</button></div>;
    if (!diary) return null;

    return (
        <div className="diary-detail-container">
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
                {/* 챕터 제목 (작게 표시) */}
                <div className="chapter-info">
                    <span className="chapter-date">{diary.date}</span>
                    <h2 className="chapter-title">{diary.chapterTitle}</h2>
                </div>

                {/* 메인 이미지 (첫 번째 이미지만 표시하거나 슬라이더로 구현) */}
                {diary.mediaUrls && diary.mediaUrls.length > 0 ? (
                    <div className="image-wrapper">
                        <img 
                            src={diary.mediaUrls[0]} 
                            alt="Diary memory" 
                            className="diary-main-image"
                        />
                    </div>
                ) : (
                    // 이미지가 없을 경우 플레이스홀더
                    <div className="image-wrapper placeholder">
                        <span>이미지 없음</span>
                    </div>
                )}

                {/* 일기 소제목 */}
                <h3 className="diary-subtitle">{diary.subtitle}</h3>

                {/* 일기 본문 (줄바꿈 처리) */}
                <div className="diary-text">
                    {diary.content.split('\n').map((line, index) => (
                        <p key={index}>{line}<br/></p>
                    ))}
                </div>

                {/* AI 감상평 / 요약 영역 (이미지의 하단 텍스트 스타일 반영) */}
                <div className="ai-comment-section">
                    <p>
                        AI가 내 목소리에서 '설렘'과 '벅참'을 정확히 찾아낸 것 같아 신기하다. 
                        앞으로의 여행도 이렇게 음성으로 남겨두면, AI가 나만의 특별한 여행기를 완성해 줄 거란 기대감이 든다.
                        (※ 이 부분은 백엔드 응답에 포함되어야 동적으로 표시 가능합니다. 현재는 하드코딩 예시입니다.)
                    </p>
                </div>
            </main>

            {/* 3. 하단 액션 버튼 (다시 채팅하기) */}
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