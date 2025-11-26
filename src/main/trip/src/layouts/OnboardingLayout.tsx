import React from 'react';
import { useNavigate } from 'react-router-dom';
import CompassIcon from '../components/common/CompassIcon';
import PageIndicator from '../components/common/PageIndicator';
import '@/styles/Onboarding.css';
import './OnboardingLayout.css'; // OnboardingLayout 전용 CSS 파일 임포트 가정

interface OnboardingLayoutProps {
  currentStep: number;
  totalSteps: number;
  title: string;
  subtitle: string;
  onNext: () => void;
  onPrev?: () => void; 
  isNextDisabled: boolean;
  children: React.ReactNode;
  showNextButton: boolean; 
}

const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
  currentStep,
  totalSteps,
  title,
  subtitle,
  onNext,
  onPrev,
  isNextDisabled,
  children,
  showNextButton,
}) => {
  const navigate = useNavigate();
  
  // 버튼 클래스: 이전에 정의한 공통 CSS 클래스 사용
  const prevButtonClass = `btn-pill btn-prev ${currentStep === 1 ? 'disabled' : ''}`;
  const nextButtonClass = `btn-pill btn-next ${isNextDisabled ? 'disabled' : 'enabled'}`;

  return (
    <div className="onboarding-layout"> 
      
      {/* 1. 🧭 나침반/일러스트 이미지 (절대 위치로 상단 고정) */}
      <div className="illustration-wrapper">
        <CompassIcon /> 
      </div>
      
      {/* 2. 메인 콘텐츠 (일러스트 아래에서 시작하도록 패딩 조정) */}
      <main className="onboarding-content">
        
        {/* 페이지 인디케이터 (Progress Bar) */}
        <div className="indicator-area">
            <PageIndicator currentStep={currentStep} totalSteps={totalSteps} />
        </div>

        {/* 제목 및 부제목 */}
        <div className="header-text-container">
          <h2 className="onboarding-title">{title}</h2> 
          <p className="onboarding-subtitle">{subtitle}</p>
        </div>

        {/* 자식 요소 (입력 필드 등) */}
        <div className="onboarding-content-inner">
          {children}
        </div>
      </main>

      {/* 3. 푸터 (이전/다음 버튼) */}
      <footer className="footer-container">
        {/* btn-group은 footer-container 내부에서 버튼을 감싸는 div로 정의 (CSS 참조) */}
        <div className="btn-group">
          {/* 이전 버튼 */}
          <button
            onClick={onPrev}
            disabled={currentStep === 1}
            className={prevButtonClass} 
          >
            이전
          </button>

          {/* 다음 버튼 */}
          {showNextButton && (
            <button
              onClick={onNext}
              disabled={isNextDisabled}
              className={nextButtonClass}
            >
              {currentStep === totalSteps ? '완료' : '다음'}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
};

export default OnboardingLayout;