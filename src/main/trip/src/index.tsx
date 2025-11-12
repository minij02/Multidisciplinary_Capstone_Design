import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // 필요에 따라 유지
import App from './App.tsx'; // 확장자 변경에 맞게 수정

// index.html 파일의 id="root" 엘리먼트를 찾습니다.
const rootElement = document.getElementById('root');

if (rootElement) {
  // TypeScript 환경에서 Non-null Assertion Operator (!) 사용
  ReactDOM.createRoot(rootElement!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("Root element not found in index.html");
}