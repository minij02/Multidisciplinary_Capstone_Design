import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, MessageCircle, Save, X, Camera } from 'lucide-react';

// -----------------------------------------------------------------------------
// 1. CSS Styles (환경 제약으로 내부 포함)
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
  
  /* 버튼 스타일 수정 */
  .action-btn-group { display: flex; gap: 10px; }
  .text-btn { background: none; border: none; font-size: 14px; color: #666; cursor: pointer; font-family: inherit; }
  .save-btn { color: #ec4899; font-weight: 600; }
  .cancel-btn { color: #999; }

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
  
  /* 편집 모드 이미지 오버레이 */
  .edit-image-overlay {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    background-color: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: white; flex-direction: column; gap: 8px;
  }

  .diary-subtitle { font-size: 20px; font-weight: 700; margin-bottom: 16px; color: #222; line-height: 1.4; }
  .diary-text { font-size: 15px; line-height: 1.8; color: #444; text-align: justify; margin-bottom: 30px; white-space: pre-line; }

  .edit-subtitle-input {
    width: 100%;
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 16px;
    color: #222;
    line-height: 1.4;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 8px;
    outline-color: #ec4899;
    font-family: inherit;
  }

  /* 편집 모드 텍스트 영역 */
  .edit-textarea {
    width: 100%; min-height: 200px; padding: 12px;
    border: 1px solid #ec4899; border-radius: 8px;
    font-family: inherit; font-size: 15px; line-height: 1.8;
    background-color: white; outline: none; resize: none;
  }

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
    
    // 기본 데이터 상태
    const [diary, setDiary] = useState<DiaryDetailResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 수정 모드 상태
    const [isEditing, setIsEditing] = useState(false);
    const [editSubtitle, setEditSubtitle] = useState(''); 
    const [editContent, setEditContent] = useState(''); // 수정 중인 텍스트
    const [editImagePreview, setEditImagePreview] = useState<string | null>(null); // 수정 중인 이미지 미리보기
    const fileInputRef = useRef<HTMLInputElement>(null);

    const targetEntryId = entryId || '1';

    // Mock Data Load (Fallback)
    const loadMockData = (targetId: string) => {
        console.log("Loading mock data for ID:", targetId);
        setDiary({
            entryId: Number(targetId),
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

    // 데이터 조회 (GET)
    useEffect(() => {
        const fetchDiaryDetail = async () => {
            setLoading(true);
            setError(null);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            try {
                const token = localStorage.getItem('accessToken');
                
                if (!token) {
                    console.warn("[DiaryDetail] No token found. Loading mock data.");
                    clearTimeout(timeoutId);
                    setTimeout(() => loadMockData(targetEntryId), 500);
                    return;
                }

                const response = await fetch(`${API_URL_BASE}/${targetEntryId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);

                if (response.ok) {
                    const data = await response.json();
                    setDiary(data);
                    // 초기 수정 상태 설정
                    setEditSubtitle(data.subtitle || '');
                    setEditContent(data.content);
                    if (data.mediaUrls && data.mediaUrls.length > 0) {
                        setEditImagePreview(data.mediaUrls[0]);
                    }
                    setLoading(false);
                } else if (response.status === 403) {
                    throw new Error("접근 권한이 없습니다 (403).");
                } else if (response.status === 404) {
                    throw new Error("해당 일기를 찾을 수 없습니다 (404).");
                } else {
                    throw new Error(`서버 오류 발생 (${response.status})`);
                }
            } catch (err: any) {
                clearTimeout(timeoutId);
                console.error("Fetch error:", err);
                // 에러 발생 시 테스트용으로 Mock Data 로드
                loadMockData(targetEntryId);
            }
        };

        fetchDiaryDetail();
    }, [targetEntryId]);

    // 수정 모드 진입
    const handleEditClick = () => {
        setIsEditing(true);
        if (diary) {
            setEditSubtitle(diary.subtitle || '');
            setEditContent(diary.content);
            setEditImagePreview(diary.mediaUrls[0] || null);
        }
    };

    // 수정 취소
    const handleCancelClick = () => {
        setIsEditing(false);
        // 원래 데이터로 복구 (상태만 리셋)
        if (diary) {
            setEditSubtitle(diary.subtitle || '');
            setEditContent(diary.content);
            setEditImagePreview(diary.mediaUrls[0] || null);
        }
    };

    // 이미지 파일 선택 핸들러
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // 수정사항 저장 (PUT)
    const handleSaveClick = async () => {
        if (!diary) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');

            // [추가] 소제목이 필수(Non-nullable)이므로 빈 문자열로 전송
             const finalSubtitle = editSubtitle.trim() === '' ? '' : editSubtitle.trim();
            // [추가] 본문 내용도 필수이므로 검사
             const finalContent = editContent.trim();
            
            // 실제 파일 업로드는 백엔드 로직에 따라 FormData를 써야 하지만,
            // 여기서는 Base64 문자열 또는 URL을 보낸다고 가정 (간소화)
            const payload = {
                subtitle: finalSubtitle,
                content: finalContent,
                imageUrl: editImagePreview // 실제로는 파일 업로드 API 호출 후 URL을 받아야 함
            };

            const response = await fetch(`${API_URL_BASE}/${diary.entryId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                // 성공 시 로컬 상태 업데이트 및 수정 모드 종료
                setDiary(prev => prev ? ({ 
                    ...prev, 
                    subtitle: finalSubtitle,
                    content: finalContent,
                    mediaUrls: editImagePreview ? [editImagePreview] : prev.mediaUrls 
                }) : null);
                setIsEditing(false);
            } else {
                alert("저장에 실패했습니다.");
            }
        } catch (error) {
            console.error("Save error:", error);
            alert("저장 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

      // ★★★ [신규] 다시 채팅하기 버튼 클릭 핸들러 ★★★
    const handleReChatClick = () => {
        if (diary) {
            navigate(`/interview/${diary.entryId}`);
        }
    };
    
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
                
                {/* 수정/저장 버튼 그룹 */}
                <div className="action-btn-group">
                    {isEditing ? (
                        <>
                            <button className="text-btn cancel-btn" onClick={handleCancelClick}>취소</button>
                            <button className="text-btn save-btn" onClick={handleSaveClick}>저장</button>
                        </>
                    ) : (
                        <button className="text-btn" onClick={handleEditClick}>수정하기</button>
                    )}
                </div>
            </header>

            {/* 2. 본문 영역 */}
            <main className="detail-content">
                <div className="chapter-info">
                    <span className="chapter-date">{diary.date}</span>
                    <h2 className="chapter-title">{diary.chapterTitle}</h2>
                </div>

                {/* 이미지 영역 */}
                <div className="image-wrapper">
                    {editImagePreview ? (
                        <img 
                            src={editImagePreview} 
                            alt="Diary memory" 
                            className="diary-main-image" 
                        />
                    ) : (
                        <div className="image-wrapper placeholder">
                            <span>이미지 없음</span>
                        </div>
                    )}

                    {/* 수정 모드일 때만 이미지 변경 오버레이 표시 */}
                    {isEditing && (
                        <div className="edit-image-overlay" onClick={() => fileInputRef.current?.click()}>
                            <Camera size={32} />
                            <span>사진 변경</span>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleImageChange} 
                                accept="image/*" 
                                style={{ display: 'none' }} 
                            />
                        </div>
                    )}
                </div>

                {isEditing ? (
                    <input
                        type="text"
                        className="edit-subtitle-input"
                        value={editSubtitle}
                        onChange={(e) => setEditSubtitle(e.target.value)}
                        placeholder="소제목을 입력해주세요 (필수)"
                    />
                ) : (
                    <h3 className="diary-subtitle">{diary.subtitle}</h3>
                )}

                {/* 텍스트 영역: 수정 모드에 따라 분기 */}
                <div className="diary-text">
                    {isEditing ? (
                        <textarea 
                            className="edit-textarea"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                        />
                    ) : (
                        (diary.content || '').split('\n').map((line, index) => (
                            <React.Fragment key={index}>
                                {line}
                                <br />
                            </React.Fragment>
                        ))
                    )}
                </div>

                <div className="ai-comment-section">
                    <p>
                        AI가 내 목소리에서 '설렘'과 '벅참'을 정확히 찾아낸 것 같아 신기하다. 
                        앞으로의 여행도 이렇게 음성으로 남겨두면, AI가 나만의 특별한 여행기를 완성해 줄 거란 기대감이 든다.
                    </p>
                </div>
            </main>

             {/* 3. 하단 액션 버튼 (수정 중에는 숨김) */}
            {!isEditing && (
                <footer className="detail-footer">
                    {/* ★★★ onClick 핸들러 연결됨 ★★★ */}
                    <button className="chat-action-btn" onClick={handleReChatClick}>
                        <MessageCircle size={18} />
                        <span>다시 채팅하기</span>
                    </button>
                </footer>
            )}
        </div>
    );
};

export default DiaryDetailPage;