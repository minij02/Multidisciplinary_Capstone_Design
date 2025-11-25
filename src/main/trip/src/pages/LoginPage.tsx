import React, { useState } from 'react';
import axios, { AxiosResponse } from 'axios';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';

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
      // NOTE: axios를 사용하기 때문에, 이 설정이 내부 JSON 파서를 완전히 우회하지 못할 수도 있습니다.
      const response: AxiosResponse<LoginResponse> = await axios.post('http://localhost:8080/api/auth/login', {
        email,
        password,
      }, {
          // 서버가 HTML을 반환했을 때의 JSON 파싱 오류를 진단하기 위한 옵션
          transformResponse: (data, headers) => {
              const contentType = headers?.["content-type"];
              // Content-Type이 JSON이 아닌 경우 (예: text/html), JSON 파싱을 시도하지 않고 텍스트를 반환합니다.
              if (contentType && !contentType.includes('application/json')) {
                  console.warn(`Unexpected content type: ${contentType}. Raw data received.`);
                  return data;
              }
              // Content-Type이 JSON이거나 헤더가 없는 경우, 기본 JSON 파싱을 시도합니다.
              try {
                  return JSON.parse(data);
              } catch (e) {
                  // 파싱 실패 시 원시 데이터를 반환하여 catch에서 처리합니다.
                  console.error("JSON parsing failed, returning raw data.");
                  return data;
              }
          }
      });
      
      // 서버가 JSON이 아닌 응답(HTML)을 반환한 경우, response.data는 파싱되지 않은 HTML 문자열일 수 있습니다.
      // 이 경우, 성공했다고 가정하고 토큰을 읽으려고 시도하면 undefined가 됩니다.
      if (typeof response.data === 'string' && response.data.startsWith('<!DOCTYPE')) {
          throw new Error("서버가 유효한 JSON 대신 HTML 오류 페이지를 반환했습니다. 백엔드 로그 확인이 필요합니다.");
      }

      const { token, type, userId } = response.data;

      // MainPage.jsx에서 'accessToken' 키를 사용하므로, 일관성 있게 'accessToken'으로 저장합니다.
      localStorage.setItem('accessToken', token);
      localStorage.setItem('tokenType', type);
      localStorage.setItem('userId', userId.toString());

      // 리다이렉트
      navigate('/main');

    } catch (err: any) {
      let message = '로그인 중 오류가 발생했습니다. 다시 시도해주세요.';

      // 1. Axios 오류 응답이 있을 때 (4xx, 5xx)
      if (err.response) {
          // TypeScript 오류 해결: err.response.data를 unknown으로 명시하고 타입 가드 사용
          const responseData = err.response.data;
          
          if (typeof responseData === 'string' && responseData.startsWith('<!DOCTYPE')) {
              message = `서버 오류 (${err.response.status}): 백엔드에서 인증/경로 문제로 HTML 오류 페이지를 반환했습니다.`;
          } else {
              // JSON 형태의 오류 메시지가 있을 때
              message = err.response.data.message || err.response.data || `서버 오류 (${err.response.status}): 예상치 못한 응답`;
          }
      } 
      // 2. JSON 파싱 오류 또는 네트워크 오류일 때 (이전처럼)
      else if (err.message && err.message.includes("Unexpected token")) {
        message = "서버 응답 오류: 서버가 유효한 JSON 대신 HTML 페이지를 반환했습니다. (CORS 또는 경로 문제일 수 있음)";
      } 
      // 3. 커스텀 에러 (try 블록 내부에서 throw된 에러)
      else if (err.message) {
          message = err.message;
      }
      
      setError(message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-0">
      <div
        className="w-full h-screen bg-white shadow-2xl flex flex-col"
        style={{ maxWidth: '390px', maxHeight: '844px', margin: 'auto' }}
      >
        <main className="flex-grow overflow-y-auto">
          <LoginForm
            email={email}
            password={password}
            error={error}
            handleInputChange={handleInputChange}
            handleLogin={handleLogin}
          />
        </main>
      </div>
      <style>
        {`
          /* LoginForm이 필요로 하는 CSS가 있다면 여기에 추가 */
        `}
      </style>
    </div>
  );
};

export default LoginPage;