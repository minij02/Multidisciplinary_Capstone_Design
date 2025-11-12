import React from 'react';
import { XCircle } from 'lucide-react';
import '../../styles/VerifyForm.css'

interface VerifyFormProps {
  email: string;
  verificationCode: string;
  resendTimer: number;
  isResending: boolean;
  error: string;
  message: string;
  handleCodeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleVerify: (e: React.FormEvent) => Promise<void>;
  handleResendCode: () => Promise<void>;
}

const VerifyForm: React.FC<VerifyFormProps> = ({
  email,
  verificationCode,
  resendTimer,
  isResending,
  error,
  message,
  handleCodeChange,
  handleVerify,
  handleResendCode,
}) => {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <form onSubmit={handleVerify} className="verify-container">
      {/* 제목 */}
      <h1 className="verify-title">계정 인증</h1>

      {/* 설명 */}
      <p className="verify-subtext">
        <span className="email-highlight">{email}</span> (으)로 코드가 발송되었습니다.
      </p>
      <p className="verify-subtext">인증 코드를 입력해 주세요.</p>

      {/* 인증 코드 입력 */}
      <input
        type="text"
        placeholder="4 Digit Code"
        value={verificationCode}
        onChange={handleCodeChange}
        maxLength={4}
        inputMode="numeric"
        className="code-input"
        required
      />

      {/* 에러 메시지 */}
      {error && (
        <p className="error-message">
          <XCircle size={16} className="error-icon" />
          {error}
        </p>
      )}

      {/* 재전송 영역 */}
      <div className="resend-section">
        <p className="resend-text">코드를 못 받으셨나요?</p>
        <button
          type="button"
          onClick={handleResendCode}
          disabled={resendTimer > 0 || isResending}
          className="resend-button"
        >
          {isResending ? '재발송 중...' : '인증 코드 다시 받기'}
        </button>
        <p className="resend-timer">
          Resend code in <span>{formatTime(resendTimer)}</span>
        </p>
        {message && <p className="success-message">{message}</p>}
      </div>

      {/* 확인 버튼 */}
      <button
        type="submit"
        className="verify-button"
        disabled={verificationCode.length !== 4}
      >
        계정 확인 완료
      </button>
    </form>
  );
};

export default VerifyForm;