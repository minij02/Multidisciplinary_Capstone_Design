import React from 'react';
import OnboardingLayout from '../../layouts/OnboardingLayout';
import '@/styles/Onboarding.css';
import { OnboardingData } from '../../pages/OnboardingPage';

interface StepProps {
  data: OnboardingData; 
  updateData: <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => void;
  handleNext: () => void;
  isNextDisabled: boolean;
  handlePrev: () => void;
}

const OnboardingStep2: React.FC<StepProps> = ({ data, updateData, handleNext, isNextDisabled, handlePrev }) => {
  const currentStep = 2;
  const totalSteps = 5;

  return (
    <OnboardingLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      title="어떤 여행을 기록하고 싶으신가요?"
      subtitle="혼자만의 사색, 연인과의 순간,
혹은 가족과의 소중한 시간
AI가 당신의 여행 스타일에 맞춰 감성적인 일기를 생성해 드려요."
      onNext={handleNext}
      onPrev={handlePrev}
      isNextDisabled={isNextDisabled}
      showNextButton={true}
    >
      <div className="flex flex-col space-y-4 h-full pt-8">
        
        <textarea
          placeholder="텍스트를 입력해주세요. (최소 10자)"
          rows={6}
          value={data.motivation}
          onChange={(e) => updateData('motivation', e.target.value)}
          className="input-common textarea-resize-none"
        />
        
        <p className="text-xs text-gray-500 text-right">
          {data.motivation.length}/10자 이상
        </p>
      </div>
    </OnboardingLayout>
  );
};

export default OnboardingStep2;