import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ChevronLeft } from 'lucide-react';
import RegisterForm from '../components/auth/RegisterForm';
import VerifyForm from '../components/auth/VerifyForm';

const API_BASE_URL = 'http://localhost:8080/api/auth';

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

type Step = 'register' | 'verify';
const RESEND_TIME_LIMIT = 300;

const RegisterPage: React.FC = () => {
  const [step, setStep] = useState<Step>('register');
  const [formData, setFormData] = useState<FormData>({ name: '', email: '', password: '', confirmPassword: '' });
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [resendTimer, setResendTimer] = useState(RESEND_TIME_LIMIT);
  const [isResending, setIsResending] = useState(false);

  const isPasswordValid = formData.password.length >= 8;
  const passwordsMatch = formData.password === formData.confirmPassword;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVerificationCode(e.target.value);
    setError('');
  };

  const handleRegister = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!isPasswordValid || !passwordsMatch) {
      setError('비밀번호가 일치하지 않거나 8자리 미만입니다.');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/register`, formData);
      setMessage(response.data);
      setStep('verify');
      setResendTimer(RESEND_TIME_LIMIT);
    } catch (err: any) {
      setError(err.response?.data || '회원가입 요청 중 오류가 발생했습니다.');
    }
  }, [formData, isPasswordValid, passwordsMatch]);

  const handleVerify = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (verificationCode.length !== 4) {
      setError('4자리 인증 코드를 입력해주세요.');
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/verify`,
        null,
        { params: { email: formData.email, code: verificationCode } }
      );
      setMessage(response.data);
    } catch (err: any) {
      setError(err.response?.data || '인증 코드 확인 중 오류가 발생했습니다.');
    }
  }, [formData.email, verificationCode]);

  const handleResendCode = useCallback(async () => {
    if (resendTimer > 0 || isResending) return;

    setError('');
    setIsResending(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/resend-code`,
        null,
        { params: { email: formData.email } }
      );
      setMessage(response.data);
      setResendTimer(RESEND_TIME_LIMIT);
    } catch (err: any) {
      setError(err.response?.data || '인증 코드 재발송에 실패했습니다.');
    } finally {
      setIsResending(false);
    }
  }, [formData.email, resendTimer, isResending]);

  useEffect(() => {
    if (step !== 'verify' || resendTimer === 0) return;

    const interval = setInterval(() => {
      setResendTimer(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const handleBack = () => {
    if (step === 'verify') {
      setStep('register');
      setError('');
      setMessage('');
      setVerificationCode('');
    }
  };

  const renderContent = () => {
    switch (step) {
      case 'register':
        return (
          <div className="flex-1 overflow-auto">
            <RegisterForm
              formData={formData}
              error={error}
              handleInputChange={handleInputChange}
              handleRegister={handleRegister}
            />
          </div>
        );
      case 'verify':
        return (
          <VerifyForm
            email={formData.email}
            verificationCode={verificationCode}
            resendTimer={resendTimer}
            isResending={isResending}
            error={error}
            message={message}
            handleCodeChange={handleCodeChange}
            handleVerify={handleVerify}
            handleResendCode={handleResendCode}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-0">
      <div
        className="w-full h-screen bg-white shadow-2xl flex flex-col"
        style={{ maxWidth: '390px', maxHeight: '844px', margin: 'auto' }}
      >
        <header className="p-4 flex items-center border-b border-gray-100">
          {(step === 'verify') && (
            <button className="text-gray-600 p-1 rounded-full hover:bg-gray-50" onClick={handleBack}>
              <ChevronLeft size={24} />
            </button>
          )}
        </header>
        <main className="flex-grow overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default RegisterPage;