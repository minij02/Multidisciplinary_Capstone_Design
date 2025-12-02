import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, ChevronRight, Settings, LogOut, Bell, Shield, 
  BookOpen, Search, Home, Loader2 
} from 'lucide-react';

// -----------------------------------------------------------------------------
// 1. CSS Styles (Embedded) - DiaryPage 레이아웃 구조 활용
// -----------------------------------------------------------------------------
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300;400;600&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

  * { box-sizing: border-box; }

  /* 전체 컨테이너: 부모 프레임에 고정 */
  .mypage-container {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    background-color: #f9fafb;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    font-family: 'Inter', 'Noto Serif KR', sans-serif;
  }

  /* --- Header (고정) --- */
  .mypage-header {
    flex-shrink: 0;
    width: 100%;
    padding: 16px 20px;
    padding-top: 24px;
    background-color: #f9fafb; /* 헤더 배경색을 본문과 일치 */
    z-index: 10;
  }
  .header-title {
    font-size: 20px;
    font-weight: 700;
    color: #1f2937;
    margin: 0;
  }

  /* --- Scroll Area (중간 콘텐츠) --- */
  .mypage-scroll-area {
    flex: 1;
    min-height: 0;
    width: 100%;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 0 20px 100px 20px; /* 좌우 패딩 및 푸터 여백 */
    
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .mypage-scroll-area::-webkit-scrollbar { display: none; }

  /* --- Profile Card --- */
  .profile-section {
    background-color: white;
    border-radius: 20px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    margin-bottom: 24px;
    margin-top: 10px;
  }
  .profile-image {
    width: 80px;
    height: 80px;
    background-color: #fce7f3;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
    color: #ec4899;
  }
  .profile-name {
    font-size: 20px;
    font-weight: 700;
    color: #111;
    margin-bottom: 4px;
  }
  .profile-date {
    font-size: 13px;
    color: #9ca3af;
  }

  /* --- Menu List --- */
  .menu-group {
    background-color: white;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0,0,0,0.03);
    margin-bottom: 24px;
  }
  .menu-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 20px;
    cursor: pointer;
    transition: background-color 0.2s;
    border-bottom: 1px solid #f3f4f6;
  }
  .menu-item:last-child { border-bottom: none; }
  .menu-item:active { background-color: #f9fafb; }
  
  .menu-left { display: flex; align-items: center; gap: 12px; }
  .menu-icon { color: #6b7280; }
  .menu-text { font-size: 15px; color: #374151; font-weight: 500; }
  .menu-arrow { color: #d1d5db; }

  /* --- Withdrawal Button --- */
  .withdrawal-section {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }
  .withdrawal-btn {
    font-size: 13px;
    color: #9ca3af;
    background: none;
    border: none;
    text-decoration: underline;
    cursor: pointer;
  }

  /* --- Footer (고정) --- */
  .bottom-nav-footer {
    position: absolute;
    bottom: 0; left: 0; width: 100%;
    background-color: white;
    box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.05);
    border-top-left-radius: 24px;
    border-top-right-radius: 24px;
    padding: 12px 0 24px 0;
    z-index: 20;
  }
  .nav-group { display: flex; justify-content: space-around; align-items: flex-end; }
  .nav-item { display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 10px; color: #9ca3af; cursor: pointer; width: 60px; }
  .nav-item-active { color: #ec4899; font-weight: 600; }
  .nav-item-center { position: relative; top: -32px; cursor: pointer; }
  .home-button-bubble { width: 56px; height: 56px; background-color: #ec4899; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 8px 16px rgba(236, 72, 153, 0.3); }

  /* Loading */
  .loading-container { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #ec4899; gap: 10px; }
  .loader-icon { animation: spin 1s linear infinite; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

// -----------------------------------------------------------------------------
// 2. Types & API Logic
// -----------------------------------------------------------------------------
interface UserInfo {
  name: string;
  email: string;
  joinDate: string; // "2024-10-01"
}

const API_BASE_URL = "http://localhost:8080/api/mypage";

const MyPage: React.FC = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // 사용자 정보 조회
  useEffect(() => {
    const fetchUserInfo = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          // 토큰 없으면 테스트용 더미 데이터 (개발 편의성)
          console.warn("[MyPage] 토큰 없음. Mock Data 로드");
          setTimeout(() => {
            setUserInfo({
              name: "다학제",
              email: "test@example.com",
              joinDate: "2024.10.01"
            });
            setLoading(false);
          }, 500);
          return;
        }

        const response = await fetch(API_BASE_URL, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          // 날짜 포맷팅 (YYYY-MM-DD -> YYYY.MM.DD)
          const formattedDate = data.joinDate.replace(/-/g, '.');
          setUserInfo({ ...data, joinDate: formattedDate });
        } else {
            // 에러 처리 (401 등)
            navigate('/login');
        }
      } catch (error) {
        console.error("Failed to fetch user info:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [navigate]);

  // 회원 탈퇴 핸들러
  const handleWithdrawal = async () => {
    if (!window.confirm("정말 탈퇴하시겠습니까?\n모든 데이터가 삭제되며 복구할 수 없습니다.")) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(API_BASE_URL, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert("회원 탈퇴가 완료되었습니다.");
        localStorage.removeItem('accessToken');
        navigate('/login');
      } else {
        alert("탈퇴 처리에 실패했습니다.");
      }
    } catch (error) {
      console.error("Withdrawal error:", error);
      alert("서버 오류가 발생했습니다.");
    }
  };

  if (loading) {
    return (
      <div className="mypage-container">
        <style>{styles}</style>
        <div className="loading-container">
          <Loader2 className="loader-icon" size={40} />
          <p>정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mypage-container">
      <style>{styles}</style>

      {/* 1. Header */}
      <header className="mypage-header">
        <h1 className="header-title">마이페이지</h1>
      </header>

      {/* 2. Scroll Area */}
      <div className="mypage-scroll-area">
        
        {/* 프로필 섹션 */}
        <div className="profile-section">
          <div className="profile-image">
            <User size={40} />
          </div>
          <h2 className="profile-name">{userInfo?.name || '사용자'}</h2>
          <span className="profile-date">{userInfo?.joinDate} 가입</span>
        </div>

        {/* 메뉴 리스트 */}
        <div className="menu-group">
          <div className="menu-item">
            <div className="menu-left">
              <Bell size={20} className="menu-icon" />
              <span className="menu-text">알림 설정</span>
            </div>
            <ChevronRight size={20} className="menu-arrow" />
          </div>
          <div className="menu-item">
            <div className="menu-left">
              <Shield size={20} className="menu-icon" />
              <span className="menu-text">계정 보안</span>
            </div>
            <ChevronRight size={20} className="menu-arrow" />
          </div>
          <div className="menu-item">
            <div className="menu-left">
              <Settings size={20} className="menu-icon" />
              <span className="menu-text">설정</span>
            </div>
            <ChevronRight size={20} className="menu-arrow" />
          </div>
        </div>

        <div className="menu-group">
            <div className="menu-item" onClick={() => {
                localStorage.removeItem('accessToken');
                navigate('/login');
            }}>
            <div className="menu-left">
              <LogOut size={20} className="menu-icon" />
              <span className="menu-text">로그아웃</span>
            </div>
            <ChevronRight size={20} className="menu-arrow" />
          </div>
        </div>

        {/* 회원 탈퇴 */}
        <div className="withdrawal-section">
          <button className="withdrawal-btn" onClick={handleWithdrawal}>
            회원 탈퇴
          </button>
        </div>
      </div>

      {/* 3. Footer (네비게이션) */}
      <footer className="bottom-nav-footer">
        <div className="nav-group">
          <div className="nav-item" onClick={() => navigate('/diary')}>
            <BookOpen size={24} />
            <span>일기페이지</span>
          </div>
          <div className="nav-item-center" onClick={() => navigate('/main')}>
            <div className="home-button-bubble">
              <Home size={32} className="home-icon" />
            </div>
          </div>
          <div className="nav-item nav-item-active" onClick={() => navigate('/mypage')}>
            <Search size={24} />
            <span>마이페이지</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MyPage;