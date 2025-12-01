import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Eye, EyeOff, AlertCircle } from 'lucide-react';
import VerifyForm from '../components/auth/VerifyForm'; // 기존 VerifyForm 재활용
import './ForgotPasswordPage.css';

// API Base URL (환경에 맞게 수정)
const API_BASE_URL = "http://localhost:8080/api/auth";

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  
  // --- State Management ---
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Email, 2: Verify, 3: Reset
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // 비밀번호 표시 여부
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // 타이머 관련 (VerifyForm용)
  const [resendTimer, setResendTimer] = useState(180); // 3분

  // --- Handlers ---

  // Step 1: 이메일 입력 후 인증 코드 발송 요청
  const handleSendCode = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 기존 유저에게 코드를 보내는 로직 (AuthController의 resend-code 활용)
      const response = await fetch(`${API_BASE_URL}/resend-code?email=${email}`, {
        method: 'POST',
      });
      
      if (response.ok) {
        setStep(2);
        setResendTimer(180); // 타이머 리셋
        setSuccessMessage("인증 코드가 발송되었습니다.");
      } else {
        const msg = await response.text();
        setError(msg || "인증 코드 발송에 실패했습니다. 이메일을 확인해주세요.");
      }
    } catch (err) {
      setError("서버 연결에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: 인증 코드 검증 요청
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/verify?email=${email}&code=${verificationCode}`, {
        method: 'POST',
      });

      if (response.ok) {
        setStep(3); // 성공 시 비밀번호 재설정 단계로 이동
        setSuccessMessage("");
      } else {
        const msg = await response.text();
        setError(msg || "인증 코드가 올바르지 않습니다.");
      }
    } catch (err) {
      setError("서버 연결 오류");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2 (재전송): 코드 재발송
  const handleResend = async () => {
    await handleSendCode();
  };

  // Step 3: 비밀번호 재설정 요청
  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (newPassword.length < 8) {
      setError("비밀번호는 최소 8자리 이상이어야 합니다.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        email,
        code: verificationCode, // 백엔드 DTO에 code 필드가 있어서 전달 필요
        newPassword,
        confirmNewPassword: confirmPassword
      };

      const response = await fetch(`${API_BASE_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert("비밀번호가 성공적으로 변경되었습니다. 다시 로그인해주세요.");
        navigate('/login');
      } else {
        const msg = await response.text();
        setError(msg || "비밀번호 변경에 실패했습니다.");
      }
    } catch (err) {
      setError("서버 연결 오류");
    } finally {
      setIsLoading(false);
    }
  };


  // --- Render Views ---

  // [화면 1] 이메일 입력
  const renderStep1 = () => (
    <div className="forgot-container">
      <header className="forgot-header">
        <button onClick={() => navigate(-1)} className="back-button">
          <ChevronLeft size={24} />
        </button>
      </header>
      
      <div className="text-group">
        <h1 className="forgot-title">비밀번호 분실</h1>
        <p className="forgot-description">
          걱정하지 마세요! 아래에 이메일 주소를 입력해 주시면,{'\n'}
          비밀번호를 재설정할 수 있는 코드를 보내드리겠습니다.
        </p>
      </div>

      <div className="input-group">
        <label className="input-label">이메일</label>
        <input 
          type="email" 
          className="forgot-input"
          placeholder="이메일을 입력하세요"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {error && <p className="error-text"><AlertCircle size={14}/> {error}</p>}
      </div>

      <div className="bottom-button-container">
        <button 
          className="action-button" 
          onClick={handleSendCode}
          disabled={!email || isLoading}
        >
          {isLoading ? "전송 중..." : "재설정 코드 보내기"}
        </button>
      </div>
    </div>
  );

  // [화면 2] 인증 코드 입력 (VerifyForm 재사용)
  // VerifyForm 내부 스타일과 레이아웃을 사용하되, props로 제어
  if (step === 2) {
    return (
      <div className="forgot-container" style={{ padding: 0 }}> {/* VerifyForm 내부 패딩 고려 */}
        <header className="forgot-header" style={{ padding: '20px' }}>
            <button onClick={() => setStep(1)} className="back-button">
            <ChevronLeft size={24} />
            </button>
        </header>
        <VerifyForm 
            email={email}
            verificationCode={verificationCode}
            resendTimer={resendTimer}
            isResending={isLoading}
            error={error || ''}
            message={successMessage}
            handleCodeChange={(e) => setVerificationCode(e.target.value)}
            handleVerify={handleVerifyCode}
            handleResendCode={handleResend}
        />
      </div>
    );
  }

  // [화면 3] 새 비밀번호 입력
  const renderStep3 = () => (
    <div className="forgot-container">
      <header className="forgot-header">
        <button onClick={() => setStep(1)} className="back-button"> {/* 처음으로 */}
          <ChevronLeft size={24} />
        </button>
      </header>

      <div className="text-group">
        <h1 className="forgot-title">비밀번호 재설정</h1>
        <p className="forgot-description">
          새 비밀번호를 입력하고, 확인을 위해 한 번 더 입력해 주세요.{'\n'}
          비밀번호 재설정 후에는 다시 로그인이 필요합니다.
        </p>
      </div>

      <div className="input-group">
        <label className="input-label">새 비밀번호</label>
        <div className="password-field-wrapper">
          <input 
            type={showNewPw ? "text" : "password"}
            className="forgot-input"
            placeholder="********"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <button type="button" className="toggle-password-btn" onClick={() => setShowNewPw(!showNewPw)}>
            {showNewPw ? <EyeOff size={20}/> : <Eye size={20}/>}
          </button>
        </div>
      </div>

      <div className="input-group">
        <label className="input-label">비밀번호 확인</label>
        <div className="password-field-wrapper">
          <input 
            type={showConfirmPw ? "text" : "password"}
            className="forgot-input"
            placeholder="********"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <button type="button" className="toggle-password-btn" onClick={() => setShowConfirmPw(!showConfirmPw)}>
            {showConfirmPw ? <EyeOff size={20}/> : <Eye size={20}/>}
          </button>
        </div>
        {error && <p className="error-text"><AlertCircle size={14}/> {error}</p>}
      </div>

      <div className="bottom-button-container">
        <button 
          className="action-button"
          onClick={handleResetPassword}
          disabled={!newPassword || !confirmPassword || isLoading}
        >
          {isLoading ? "변경 중..." : "비밀번호 재설정 완료"}
        </button>
      </div>
    </div>
  );

  return step === 3 ? renderStep3() : renderStep1();
};

export default ForgotPasswordPage;