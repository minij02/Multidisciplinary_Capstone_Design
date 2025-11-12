import React, { useState } from 'react';
import '../../styles/RegisterForm.css'
import { Eye, EyeOff, XCircle } from 'lucide-react';

interface RegisterFormProps {
  formData: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  };
  error: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRegister: (e: React.FormEvent) => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({
  formData,
  error,
  handleInputChange,
  handleRegister,
}) => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const isPasswordValid = formData.password.length >= 8;
  const passwordsMatch = formData.password === formData.confirmPassword;

  return (
    <form className="form-container" onSubmit={handleRegister}>
      <h1 className="form-title">회원가입</h1>

      <input
        type="text"
        name="name"
        placeholder="이름을 입력하세요"
        value={formData.name}
        onChange={handleInputChange}
        className="input-field"
        required
      />

      <input
        type="email"
        name="email"
        placeholder="이메일을 입력하세요"
        value={formData.email}
        onChange={handleInputChange}
        className="input-field"
        required
      />

      <div className="password-wrapper">
        <input
          type={passwordVisible ? 'text' : 'password'}
          name="password"
          placeholder="비밀번호"
          value={formData.password}
          onChange={handleInputChange}
          className="input-field"
          required
        />
        <button
          type="button"
          onClick={() => setPasswordVisible(!passwordVisible)}
          className="toggle-visibility"
        >
          {passwordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      <p className="password-note">비밀번호는 최소 8자리 이상이어야 합니다.</p>

      <div className="password-wrapper">
        <input
          type={confirmPasswordVisible ? 'text' : 'password'}
          name="confirmPassword"
          placeholder="비밀번호 확인"
          value={formData.confirmPassword}
          onChange={handleInputChange}
          className="input-field"
          required
        />
        <button
          type="button"
          onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
          className="toggle-visibility"
        >
          {confirmPasswordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      {error && (
        <p className="error-message">
          <XCircle size={16} className="error-icon" />
          {error}
        </p>
      )}

      <button
        type="submit"
        className="submit-button"
        disabled={
          !formData.name || !formData.email || !isPasswordValid || !passwordsMatch
        }
      >
        계정 만들기
      </button>

      <p className="terms">
        By continuing, you agree to our <a href="#">Terms of Service</a> and{' '}
        <a href="#">Privacy Policy</a>.
      </p>
    </form>
  );
};

export default RegisterForm;