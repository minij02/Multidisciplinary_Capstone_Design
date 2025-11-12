import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';

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
      const response = await axios.post('http://localhost:8080/api/auth/login', {
        email,
        password,
      });

      const { token, type, userId } = response.data;

      // 토큰을 localStorage에 저장
      localStorage.setItem('token', token);
      localStorage.setItem('tokenType', type);
      localStorage.setItem('userId', userId.toString());

      // 리다이렉트
      navigate('/main');

    } catch (err: any) {
      const message =
        err.response?.data || '로그인 중 오류가 발생했습니다. 다시 시도해주세요.';
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
    </div>
  );
};

export default LoginPage;