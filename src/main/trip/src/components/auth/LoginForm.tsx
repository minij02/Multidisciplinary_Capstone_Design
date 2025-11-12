import React, { useState } from 'react';
import '../../styles/auth/LoginForm.css'
import { Eye, EyeOff, XCircle } from 'lucide-react';

interface LoginFormProps {
  email: string;
  password: string;
  error: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleLogin: (e: React.FormEvent) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({
  email,
  password,
  error,
  handleInputChange,
  handleLogin,
}) => {
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <form onSubmit={handleLogin} className="login-container">
      <h1 className="login-title">로그인</h1>

      <label className="input-label" htmlFor="email">이메일</label>
      <input
        type="email"
        name="email"
        id="email"
        value={email}
        onChange={handleInputChange}
        className="input-field"
        placeholder="이메일을 입력하세요"
        required
      />

      <label className="input-label" htmlFor="password">비밀번호</label>
      <div className="password-wrapper">
        <input
          type={passwordVisible ? 'text' : 'password'}
          name="password"
          id="password"
          value={password}
          onChange={handleInputChange}
          className={`password-input ${error ? 'error' : ''}`}
          placeholder="비밀번호를 입력하세요"
          required
        />
        <button
          type="button"
          className="toggle-visibility"
          onClick={() => setPasswordVisible(!passwordVisible)}
        >
          {passwordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      {error && (
        <p className="error-message">
          <XCircle size={16} className="error-icon" />
          {error}
        </p>
      )}

      <div className="forgot-links">
        <a href="#">아이디</a> | <a href="#">비밀번호 찾기</a>
      </div>

      <button
        type="submit"
        className="login-button"
        disabled={!email || !password}
      >
        로그인
      </button>

      <p className="or-divider">or login with</p>

      <button type="button" className="google-button">
        <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" width="20" height="20" />
        구글 로그인하기
      </button>
    </form>
  );
};

export default LoginForm;