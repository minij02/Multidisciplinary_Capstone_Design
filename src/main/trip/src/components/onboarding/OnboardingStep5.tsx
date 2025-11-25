import React from 'react';
import OnboardingLayout from '../../layouts/OnboardingLayout';
import { Loader2 } from 'lucide-react';
import '../../styles/Onboarding.css';
import { OnboardingData } from '../../pages/OnboardingPage';

interface StepProps {
  data: OnboardingData; 
  updateData: <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => void;
  handleNext: () => void;
  isNextDisabled: boolean;
  handlePrev: () => void;
  isSubmitting: boolean; 
  submissionError: string | null;
}

const OnboardingStep5: React.FC<StepProps> = ({ data, updateData, handleNext, isNextDisabled, handlePrev, isSubmitting, submissionError }) => {
  const currentStep = 5;
  const totalSteps = 5;
  
  // 마지막 단계에서는 데이터 입력 대신 최종 확인 로직을 처리합니다.
  const handleConfirm = (e: React.ChangeEvent<HTMLInputElement>) => {
      updateData('isConfirmed', e.target.checked);
  };

  return (
    <OnboardingLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      title="질문에 모두 답해주셨네요!"
      subtitle="당신의 여행을 기록할 준비 중이에요
이제, 당신의 이야기를 들려주세요"
      onNext={handleNext}
      onPrev={handlePrev}
      isNextDisabled={isNextDisabled}
      showNextButton={true}
    >
      <div className="flex flex-col items-center justify-center h-full pt-8">
        
        {/* 로딩 인디케이터 */}
        <Loader2 className="h-16 w-16 text-red-500 animate-spin" />
        
        <div className="mt-8 text-center">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
                잠시만 기다려주세요...
            </h3>
            <p className="text-sm text-gray-600">
                AI가 일정을 생성하는 중입니다.
            </p>
        </div>

        {/* 최종 확인 체크박스 */}
        <div className="mt-12 w-full flex items-center justify-start">
            <input
                type="checkbox"
                id="confirm"
                checked={data.isConfirmed}
                onChange={handleConfirm}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="confirm" className="ml-2 text-sm text-gray-700">
                입력된 정보를 확인하고 AI 일정 생성에 동의합니다.
            </label>
        </div>

      </div>
    </OnboardingLayout>
  );
};

export default OnboardingStep5;