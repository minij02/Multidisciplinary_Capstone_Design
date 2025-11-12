import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Onboarding.css';

const Onboarding: React.FC = () => {
  const navigate = useNavigate();

  const handleRegisterClick = () => {
    navigate('/register');
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:8080/oauth2/authorization/google';
    // 백엔드에서 소셜 로그인 엔드포인트에 연결되어야 함
  };

  return (
    <div className="onboarding-container">
      {/* 로고 이미지 */}
      <img
        src="/TripDiaryLogo.png"
        alt="Trip Diary Logo"
        className="onboarding-logo"
      />

      {/* 버튼 영역 */}
      <div className="onboarding-buttons">
        <button className="btn-outlined" onClick={handleRegisterClick}>
          회원가입
        </button>
        <button className="btn-filled" onClick={handleLoginClick}>
          로그인
        </button>
        <button className="btn-google" onClick={handleGoogleLogin}>
          <img
            src="https://developers.google.com/identity/images/g-logo.png"
            alt="Google"
          />
          구글 로그인하기
        </button>
      </div>
    </div>
  );
};

export default Onboarding;