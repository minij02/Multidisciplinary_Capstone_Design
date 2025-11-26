import React from 'react';
import OnboardingLayout from '../../layouts/OnboardingLayout';
import { OnboardingData } from '../../pages/OnboardingPage';
import './OnboardingStep1.css'; // 👈 새로 정의할 CSS 파일을 임포트합니다.

interface StepProps {
  data: OnboardingData; 
  updateData: <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => void;
  handleNext: () => void;
  isNextDisabled: boolean;
}

const OnboardingStep1: React.FC<StepProps> = ({ data, updateData, handleNext, isNextDisabled }) => {
  const currentStep = 1;
  const totalSteps = 5;
  
  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateData('city', e.target.value);
  };
  
  const handleDateChange = (type: 'startDate' | 'endDate', e: React.ChangeEvent<HTMLInputElement>) => {
    updateData(type, e.target.value);
  };

  return (
    <OnboardingLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      title="언제, 어디서 여행하셨나요?"
      subtitle="여행지(도시/국가)와 기간을 알려주세요. AI가 일정과 분위기를 고려해 드릴게요."
      onNext={handleNext}
      isNextDisabled={isNextDisabled}
      showNextButton={true}
    >
      <div className="onboarding-step1-content">
        
        {/* 도시/국가 입력 */}
        <div className="input-container">
          <input
            type="text"
            placeholder="여행지(도시/국가) 입력하세요"
            value={data.city}
            onChange={handleCityChange}
            className="input-field"
          />
        </div>

        {/* 날짜 입력 */}
        <div className="input-container">
          <div className="date-group">
            <input
              type="date"
              value={data.startDate || ''}
              onChange={(e) => handleDateChange('startDate', e)}
              className="input-field date-input"
              placeholder="시작일"
            />
            <input
              type="date"
              value={data.endDate || ''}
              onChange={(e) => handleDateChange('endDate', e)}
              className="input-field date-input"
              placeholder="종료일"
            />
          </div>
        </div>
        
      </div>
    </OnboardingLayout>
  );
};

export default OnboardingStep1;