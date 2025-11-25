import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import GlobalLayout from './layouts/GlobalLayout';
import Onboarding from './components/onboarding/Onboarding';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import OAuthSuccessPage from './pages/OAuthSuccessPage';
import OnboardingPage from './pages/OnboardingPage';
import MainPage from './pages/MainPage';

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
    ],
  },
]);

const App = () => {
  return <RouterProvider router={router} />;
};

export default App;