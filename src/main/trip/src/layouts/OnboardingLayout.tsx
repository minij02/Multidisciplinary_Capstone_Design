import React from 'react';
import { useNavigate } from 'react-router-dom';
import CompassIcon from '../components/common/CompassIcon';
import PageIndicator from '../components/common/PageIndicator';
import '@/styles/Onboarding.css';

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
  // 이전 버튼의 스타일 결정
  const prevButtonClass = `btn-common btn-prev ${currentStep === 1 ? 'disabled' : ''}`;
  
  // 다음 버튼의 스타일 결정
  const nextButtonClass = `btn-common btn-next ${isNextDisabled ? 'disabled' : 'enabled'}`;

  return (
    <div className="onboarding-layout"> 
      {/* 나침반 아이콘 */}
      <div className="flex justify-center">
        <CompassIcon />
      </div>

      {/* 페이지 인디케이터 */}
      <PageIndicator currentStep={currentStep} totalSteps={totalSteps} />

      {/* 제목 및 부제목 */}
      <div className="text-center mb-8 flex-shrink-0">
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        <p className="text-sm text-gray-500 mt-2">{subtitle}</p>
      </div>

      {/* 메인 콘텐츠 (자식 요소) */}
      <main className="flex-grow overflow-y-auto pb-4">
        {children}
      </main>

      {/* 푸터 (이전/다음 버튼) */}
      <footer className="footer-container flex-shrink-0">
        <div className="flex space-x-3 w-full">
          {/* 이전 버튼 */}
          <button
            onClick={onPrev}
            disabled={currentStep === 1}
            className={prevButtonClass} 
            // 이미지와 유사한 모양을 위해 스타일 적용
            style={{
              flex: 1, // 버튼이 같은 너비를 가지도록
              padding: '16px 24px',
              borderRadius: '9999px', // 완전히 둥근 모서리
              border: '1px solid #e5e7eb', // 얇은 테두리
              fontWeight: '600',
              fontSize: '1.125rem', // 텍스트 크기 증가
              lineHeight: '1.75rem',
            }}
          >
            이전
          </button>

          {/* 다음 버튼 */}
          {showNextButton && (
            <button
              onClick={onNext}
              disabled={isNextDisabled}
              className={nextButtonClass}
              style={{
                flex: 1, 
                padding: '16px 24px',
                borderRadius: '9999px', 
                border: '1px solid #e5e7eb', // 다음 버튼도 얇은 테두리 추가
                fontWeight: '600',
                fontSize: '1.125rem', 
                lineHeight: '1.75rem',
              }}
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