import React from 'react';
import '../../layouts/OnboardingLayout.css'

interface PageIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const PageIndicator: React.FC<PageIndicatorProps> = ({ currentStep, totalSteps }) => {
  const indicators = Array.from({ length: totalSteps }, (_, index) => (
    <div
      key={index}
      className={`indicator-dot ${index + 1 === currentStep ? 'active' : ''}`}
    />
  ));

  return (
    <div className="indicator-container">
      {indicators}
    </div>
  );
};

export default PageIndicator;