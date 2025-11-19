import { Outlet } from "react-router-dom";
import "./GlobalLayout.css";

const GlobalLayout = () => {
  return (
    <div className="layout-background">
      <div className="mobile-container">
        {/* 여기에 각 페이지 컴포넌트들이 렌더링됩니다 */}
        <Outlet /> 
      </div>
    </div>
  );
};

export default GlobalLayout;