import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const OAuthSuccessPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      localStorage.setItem('token', token); // JWT 저장
      navigate('/main', { replace: true }); // 바로 메인 페이지로 이동
    } else {
      navigate('/login', { replace: true }); // 토큰 없으면 로그인 페이지로 이동
    }
  }, []);

  return null;
};

export default OAuthSuccessPage;