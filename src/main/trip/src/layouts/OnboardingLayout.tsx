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
  const prevButtonClass = `btn-pill btn-prev`;
  const nextButtonClass = `btn-pill btn-next`;

  return (
    <div className="onboarding-layout">
      
      {/* 1. 상단 이미지 */}
      <div className="illustration-wrapper">
        <CompassIcon />
      </div>
      
      {/* 2. 페이지 인디케이터 */}
      <div className="indicator-area">
         <PageIndicator currentStep={currentStep} totalSteps={totalSteps} />
      </div>

      {/* 3. 메인 콘텐츠 (스크롤 영역) */}
      <main className="onboarding-content">
        <div className="header-text-container">
          <h2 className="onboarding-title">{title}</h2>
          <p className="onboarding-subtitle">{subtitle}</p>
        </div>

        <div className="onboarding-content-inner">
          {children}
        </div>
      </main>

      {/* 4. 하단 버튼 (프레임 하단 고정) */}
      <footer className="footer-container">
        <div className="btn-group">
          <button
            onClick={onPrev}
            disabled={currentStep === 1}
            className={prevButtonClass}
          >
            이전
          </button>

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