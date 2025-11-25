import React from 'react';
import OnboardingLayout from '../../layouts/OnboardingLayout';
import '../../styles/Onboarding.css';
import { OnboardingData } from '../../pages/OnboardingPage';

interface StepProps {
  data: OnboardingData; 
  updateData: <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => void;
  handleNext: () => void;
  isNextDisabled: boolean;
  handlePrev: () => void;
}

const OnboardingStep3: React.FC<StepProps> = ({ data, updateData, handleNext, isNextDisabled, handlePrev }) => {
  const currentStep = 3;
  const totalSteps = 5;

  return (
    <OnboardingLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      title="여행의 테마는 무엇인가요?"
      subtitle="여행의 유형 (국내/해외), 
목적 (휴가, 출장, 호캉스 등)을 알려주세요."
      onNext={handleNext}
      onPrev={handlePrev}
      isNextDisabled={isNextDisabled}
      showNextButton={true}
    >
       <div className="flex flex-col h-full pt-8">
        <input
          type="text"
          placeholder="텍스트를 입력하세요"
          value={data.theme}
          onChange={(e) => updateData('theme', e.target.value)}
          className="input-common" // CSS 클래스 사용
        />

      </div>
    </OnboardingLayout>
  );
};

export default OnboardingStep3;