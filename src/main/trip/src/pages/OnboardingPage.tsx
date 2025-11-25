import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingStep1 from '../components/onboarding/OnboardingStep1';
import OnboardingStep2 from '../components/onboarding/OnboardingStep2';
import OnboardingStep3 from '../components/onboarding/OnboardingStep3';
import OnboardingStep4 from '../components/onboarding/OnboardingStep4';
import OnboardingStep5 from '../components/onboarding/OnboardingStep5';

// 온보딩 데이터의 상태 타입을 정의합니다.
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
 * [수정된 API 로직] 지수 백오프 및 JWT 토큰 인증을 포함한 API 호출 및 재시도 로직
 */
const callApiWithRetry = async (payload: any, maxRetries: number): Promise<number> => {
    // 1. JWT 토큰 획득 및 인증 검사
    const token = localStorage.getItem('accessToken'); 
    
    if (!token) {
        throw new Error("AUTH_REQUIRED: 인증 토큰을 찾을 수 없습니다. 로그인이 필요합니다.");
    }

    const headers: HeadersInit = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // JWT 토큰을 헤더에 추가
    };
    
    let lastError = null;
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(API_URL_BASE, {
                method: 'POST',
                headers: headers, // 수정된 headers 객체 사용
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                // API는 생성된 챕터 ID (Long)를 반환함
                const chapterId = await response.json();
                if (typeof chapterId === 'number') {
                    return chapterId; 
                }
                throw new Error("서버 응답 형식이 올바르지 않습니다.");
            } else if (response.status === 401 || response.status === 403) {
                // 401 Unauthorized 또는 403 Forbidden 시 즉시 인증 오류 throw
                throw new Error("AUTH_EXPIRED: 인증이 만료되었거나 유효하지 않습니다. 다시 로그인해 주세요.");
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
            
            // 인증 오류 (AUTH_EXPIRED 또는 AUTH_REQUIRED)는 재시도하지 않고 즉시 throw
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage.includes("AUTH_REQUIRED") || errorMessage.includes("AUTH_EXPIRED")) {
                throw lastError;
            }
            
            if (i < maxRetries - 1) {
                const delay = Math.pow(2, i) * 1000 + Math.random() * 500;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    // 마지막 시도 후 최종 에러 throw
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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionError, setSubmissionError] = useState<string | null>(null);

    const navigate = useNavigate();

    const handleNext = useCallback(async () => {
        setSubmissionError(null);
        
        // 제출 중이거나 다음 버튼이 비활성화 상태면 실행하지 않음
        if (isSubmitting || isNextDisabled()) return; 

        if (currentStep < TOTAL_STEPS) {
            setCurrentStep(prev => prev + 1);
        } else {
            // 마지막 단계 (Step 5): API 제출
            if (!data.isConfirmed) return; // 최종 확인 필수

            setIsSubmitting(true);

            // 1. NewChapterRequest 형식에 맞게 데이터 준비
            const payload = {
                startDate: data.startDate, // YYYY-MM-DD
                endDate: data.endDate,
                travelStyle: data.motivation,
                travelTheme: data.theme,
                travelTitle: data.name,
                // 백엔드 요청에 city를 포함해야 할 경우 추가: city: data.city,
            };
                
            try {
                // 2. API 호출 및 재시도
                const chapterId = await callApiWithRetry(payload, API_MAX_RETRIES);

                // 3. 성공 시, 메인 페이지 또는 새 챕터 페이지로 이동
                console.log(`New Chapter created with ID: ${chapterId}`);
                navigate(`/main`); // 메인 페이지로 이동하거나
                // navigate(`/chapter/${chapterId}`); // 새 챕터 상세 페이지로 이동
                
            } catch (error) {
                // 4. 실패 시, 오류 메시지 표시 및 인증 오류 처리
                console.error("Chapter submission failed:", error);
                const errorMessage = error instanceof Error ? error.message : String(error);
                setSubmissionError(`챕터 생성 중 오류 발생: ${errorMessage}`);
                
                // [인증 오류 처리] 토큰 관련 문제 발생 시 로그인 페이지로 리디렉션
                if (errorMessage.includes("AUTH_REQUIRED") || errorMessage.includes("AUTH_EXPIRED")) {
                    console.log("인증 오류 발생, 로그인 페이지로 이동합니다.");
                    // 토큰 제거 후 이동 (선택적)
                    localStorage.removeItem('accessToken');
                    navigate('/login'); 
                }
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
        if (isSubmitting) return true;

        switch (currentStep) {
            case 1: // 도시와 날짜
                return !data.city || !data.startDate || !data.endDate;
            case 2: // 동기
                return !data.motivation || data.motivation.length < 10; // 10자 미만 테스트 가정
            case 3: // 테마
                return !data.theme;
            case 4: // 여행 이름
                return !data.name;
            case 5: // 최종 확인
                // 최종 단계에서는 isConfirmed가 true여야만 제출 시도 가능
                return !data.isConfirmed; 
            default:
                return true;
        }
    }, [currentStep, data, isSubmitting]);

    const renderStep = () => {
        const stepProps = {
            data, 
            updateData, 
            handleNext, 
            isNextDisabled: isNextDisabled(), 
            handlePrev,
            currentStep, // 현재 단계 번호 전달
            TOTAL_STEPS // 전체 단계 수 전달
        };

        switch (currentStep) {
            case 1:
                //  
                return <OnboardingStep1 {...stepProps} />; 
            case 2:
                // 
                return <OnboardingStep2 {...stepProps} />;
            case 3:
                // 
                return <OnboardingStep3 {...stepProps} />;
            case 4:
                // 
                return <OnboardingStep4 {...stepProps} />;
            case 5:
                // 
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