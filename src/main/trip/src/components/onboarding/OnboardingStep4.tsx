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

const OnboardingStep4: React.FC<StepProps> = ({ data, updateData, handleNext, isNextDisabled, handlePrev }) => {
  const currentStep = 4;
  const totalSteps = 5;

  return (
    <OnboardingLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      title="이 여행을 무엇이라 부를까요?"
      subtitle="나중에 이 여행을 떠올렸을 때 
미소 지을 수 있는 
멋진 제목을 지어주세요."
      onNext={handleNext}
      onPrev={handlePrev}
      isNextDisabled={isNextDisabled}
      showNextButton={true}
    >
      <div className="flex flex-col space-y-4 h-full pt-8">
        <input
          type="text"
          placeholder="텍스트를 입력하세요"
          value={data.name}
          onChange={(e) => updateData('name', e.target.value)}
          className="input-common"
          required
        />
      </div>
    </OnboardingLayout>
  );
};

export default OnboardingStep4;