import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import GlobalLayout from './layouts/GlobalLayout';
import Onboarding from './components/onboarding/Onboarding';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import OAuthSuccessPage from './pages/OAuthSuccessPage';
import OnboardingPage from './pages/OnboardingPage';
import MainPage from './pages/MainPage';
import DiaryPage from './pages/DiaryPage';
import DiaryWrite from './components/diary/DiaryWrite'; 
import InterviewChat from './components/interview/InterviewChat';
import ImageGallery from './components/gallery/ImageGallery';

const router = createBrowserRouter([
  {
    path: "/",
    element: <GlobalLayout />, // 여기서 전역 레이아웃을 적용합니다.
    children: [
      {
        index: true, 
        element: <Onboarding />,
      },
      {
        path: "register",
        element: <RegisterPage />,
      },
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        path: "oauth-success",
        element: <OAuthSuccessPage />,
      },
      {
        path: "onboarding",
        element: <OnboardingPage />,
      },
      {
        path: "main",
        element: <MainPage />,
      },
      {
        path: "diary",
        element: <DiaryPage />,
      },
      {
        path: "diary/write", // 일기 작성 시작 페이지
        element: <DiaryWrite />,
      },
      {
        path: "interview/:diaryEntryId", // 음성/채팅 인터뷰 페이지
        element: <InterviewChat />,
      },
      {
        path: "diary/select-image/:diaryEntryId", // 이미지 선택 페이지
        element: <ImageGallery />,
      },
    ],
  },
]);

const App = () => {
  return <RouterProvider router={router} />;
};

export default App;