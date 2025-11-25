import React from 'react';
import OnboardingLayout from '../../layouts/OnboardingLayout';
import { OnboardingData } from '../../pages/OnboardingPage';

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
      <div className="flex flex-col space-y-4 h-full pt-8">
        
        {/* 도시/국가 입력 */}
        <div className="w-full">
          <input
            type="text"
            placeholder="여행지(도시/국가) 입력하세요"
            value={data.city}
            onChange={handleCityChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* 날짜 입력 */}
        <div className="w-full">
          <div className="flex space-x-4">
            <input
              type="date"
              value={data.startDate || ''}
              onChange={(e) => handleDateChange('startDate', e)}
              className="w-1/2 p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-center"
            />
             <input
              type="date"
              value={data.endDate || ''}
              onChange={(e) => handleDateChange('endDate', e)}
              className="w-1/2 p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-center"
            />
          </div>
        </div>
        
      </div>
    </OnboardingLayout>
  );
};

export default OnboardingStep1;