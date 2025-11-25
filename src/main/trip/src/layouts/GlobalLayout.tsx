import React from 'react';
import { Outlet } from 'react-router-dom';
import './GlobalLayout.css';

/**
 * GlobalLayout 컴포넌트
 * - 모든 페이지에 공통으로 적용되는 모바일 뷰포트 제한 및 중앙 정렬 컨테이너 역할을 합니다.
 */
const GlobalLayout: React.FC = () => {
  return (
    <div className="global-container"> 
      <div 
        className="mobile-frame"
      >
        {/*
          GlobalLayout이 자식 라우트를 렌더링하는 위치
        */}
        <Outlet />
      </div>
    </div>
  );
};

export default GlobalLayout;