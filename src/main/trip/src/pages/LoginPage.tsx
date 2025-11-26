import React, { useState } from 'react';
import axios, { AxiosResponse } from 'axios';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import './LoginPage.css'; // 👈 새로 정의할 CSS 파일 임포트

// API 응답 구조를 정의합니다 (옵션: axios.post의 반환 타입이 any이므로 명시적으로 지정)
interface LoginResponse {
    token: string;
    type: string;
    userId: number;
}

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'email') setEmail(value);
    if (name === 'password') setPassword(value);
    setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // [재수정] 응답 본문이 HTML일 경우 JSON 파싱 오류를 피하기 위해 responseType을 텍스트로 설정하고,
      // 응답을 수동으로 처리하는 `transformResponse`를 사용합니다.
      const response: AxiosResponse<LoginResponse> = await axios.post('http://localhost:8080/api/auth/login', {
        email,
        password,
      }, {
          transformResponse: (data, headers) => {
              const contentType = headers?.["content-type"];
              if (contentType && !contentType.includes('application/json')) {
                  console.warn(`Unexpected content type: ${contentType}. Raw data received.`);
                  return data;
              }
              try {
                  return JSON.parse(data);
              } catch (e) {
                  console.error("JSON parsing failed, returning raw data.");
                  return data;
              }
          }
      });
      
      if (typeof response.data === 'string' && response.data.startsWith('<!DOCTYPE')) {
          throw new Error("서버가 유효한 JSON 대신 HTML 오류 페이지를 반환했습니다. 백엔드 로그 확인이 필요합니다.");
      }

      const { token, type, userId } = response.data;

      localStorage.setItem('accessToken', token);
      localStorage.setItem('tokenType', type);
      localStorage.setItem('userId', userId.toString());

      // 리다이렉트
      navigate('/main');

    } catch (err: any) {
      let message = '로그인 중 오류가 발생했습니다. 다시 시도해주세요.';

      if (err.response) {
          const responseData = err.response.data;
          
          if (typeof responseData === 'string' && responseData.startsWith('<!DOCTYPE')) {
              message = `서버 오류 (${err.response.status}): 백엔드에서 인증/경로 문제로 HTML 오류 페이지를 반환했습니다.`;
          } else {
              message = err.response.data.message || err.response.data || `서버 오류 (${err.response.status}): 예상치 못한 응답`;
          }
      } 
      else if (err.message && err.message.includes("Unexpected token")) {
        message = "서버 응답 오류: 서버가 유효한 JSON 대신 HTML 페이지를 반환했습니다. (CORS 또는 경로 문제일 수 있음)";
      } 
      else if (err.message) {
          message = err.message;
      }
      
      setError(message);
    }
  };

  return (
    // min-h-screen bg-gray-100 flex justify-center items-center p-0
    <div className="login-page-container">
      {/* w-full h-screen bg-white shadow-2xl flex flex-col */}
      <div className="login-app-frame">
        <main className="login-main-content">
          <LoginForm
            email={email}
            password={password}
            error={error}
            handleInputChange={handleInputChange}
            handleLogin={handleLogin}
          />
        </main>
      </div>
    </div>
  );
};

export default LoginPage;