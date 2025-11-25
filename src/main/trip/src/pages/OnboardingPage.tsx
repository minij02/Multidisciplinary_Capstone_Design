import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingStep1 from '../components/onboarding/OnboardingStep1.tsx';
import OnboardingStep2 from '../components/onboarding/OnboardingStep2.tsx';
import OnboardingStep3 from '../components/onboarding/OnboardingStep3.tsx';
import OnboardingStep4 from '../components/onboarding/OnboardingStep4.tsx';
import OnboardingStep5 from '../components/onboarding/OnboardingStep5.tsx';

export interface OnboardingData {
  city: string;
  startDate: string | null;
  endDate: string | null;
  motivation: string; 
  theme: string; 
  name: string; 
  isConfirmed: boolean;
}

const TOTAL_STEPS = 5;
const API_URL_BASE = "http://localhost:8080/api/chapters/new";
const API_MAX_RETRIES = 5;

/**
 * 지수 백오프를 사용한 API 호출 재시도 로직
 */
const callApiWithRetry = async (payload: any, maxRetries: number): Promise<number> => {
    let lastError = null;
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(API_URL_BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                // API는 생성된 챕터 ID (Long)를 반환함
                const chapterId = await response.json();
                if (typeof chapterId === 'number') {
                    return chapterId; 
                }
                throw new Error("서버 응답 형식이 올바르지 않습니다.");
            } else if (response.status === 400) {
                // 400 Bad Request는 유효성 검사 실패이므로 재시도하지 않고 즉시 오류 처리
                const errorBody = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(`유효성 검사 오류: ${errorBody.message || response.statusText}`);
            } else {
                // 5xx 및 기타 transient 오류는 재시도
                throw new Error(`서버 오류: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            lastError = error;
            if (i < maxRetries - 1) {
                const delay = Math.pow(2, i) * 1000 + Math.random() * 500;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    throw lastError;
};


const OnboardingPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    city: '',
    startDate: null,
    endDate: null,
    motivation: '',
    theme: '',
    name: '',
    isConfirmed: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false); // 제출 상태
  const [submissionError, setSubmissionError] = useState<string | null>(null); // 오류 메시지

  const navigate = useNavigate();

  const handleNext = useCallback(async () => {
    setSubmissionError(null);
    
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(prev => prev + 1);
    } else {
      // 마지막 단계 (Step 5): API 제출
      if (isSubmitting || !data.isConfirmed || isNextDisabled()) return;

      setIsSubmitting(true);

      // 1. NewChapterRequest 형식에 맞게 데이터 준비
      const payload = {
        startDate: data.startDate, // LocalDate 형식 (YYYY-MM-DD)
        travelStyle: data.motivation,
        travelTheme: data.theme,
        travelTitle: data.name,
      };
        
      try {
          // 2. API 호출 및 재시도
          const chapterId = await callApiWithRetry(payload, API_MAX_RETRIES);

          // 3. 성공 시, 새 챕터 페이지로 이동 (예시 경로)
          console.log(`New Chapter created with ID: ${chapterId}`);
          navigate(`/chapter/${chapterId}`); 

      } catch (error) {
          // 4. 실패 시, 오류 메시지 표시
          console.error("Chapter submission failed:", error);
          setSubmissionError(`챕터 생성 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
          setIsSubmitting(false);
      }
    }
  }, [currentStep, data, isSubmitting, navigate]);

  const handlePrev = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const updateData = useCallback(<K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => {
    setData(prev => ({ ...prev, [key]: value }));
  }, []);

  // 각 단계별 유효성 검사 (다음 버튼 활성화 기준)
  const isNextDisabled = useCallback(() => {
    if (isSubmitting) return true; // 제출 중일 때는 항상 비활성화

    switch (currentStep) {
      case 1: // 도시와 날짜
        return !data.city || !data.startDate || !data.endDate;
      case 2: // 동기
        return !data.motivation || data.motivation.length < 10;
      case 3: // 테마
        return !data.theme;
      case 4: // 여행 이름
        return !data.name;
      case 5: // 최종 확인
        return !data.isConfirmed; 
      default:
        return true;
    }
  }, [currentStep, data, isSubmitting]);

  const renderStep = () => {
    // 모든 단계에서 필요한 공통 props를 정의합니다.
    const stepProps = {
      data, 
      updateData, 
      handleNext, 
      isNextDisabled: isNextDisabled(), 
      handlePrev
    };

    switch (currentStep) {
      case 1:
        return <OnboardingStep1 {...stepProps} />; 
      case 2:
        return <OnboardingStep2 {...stepProps} />;
      case 3:
        return <OnboardingStep3 {...stepProps} />;
      case 4:
        return <OnboardingStep4 {...stepProps} />;
      case 5:
        return (
          <OnboardingStep5 
            {...stepProps} 
            isSubmitting={isSubmitting}
            submissionError={submissionError}
          />
        );
      default:
        return <div>페이지를 찾을 수 없습니다.</div>;
    }
  };

  return (
    <div className="w-full h-full">
        {renderStep()}
    </div>
  );
};

export default OnboardingPage;