
import { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';

import Navbar from './components/Navbar/Navbar';

import ClientMainPage from './containers/ClientPage/MainPage/MainPage';
import ProviderMainPage from './containers/ProviderPage/MainPage/MainPage';

import UserPage from './containers/ClientPage/UserPage/UserPage';
import StorePage from './containers/ProviderPage/StorePage/StorePage';

import ClientNotificationPage from './containers/ClientPage/NotificationPage/NotificationPage';
import ProviderNotificationPage from './containers/ProviderPage/NotificationPage/NotificationPage';

import LoginPage from './containers/CommonPage/LoginPage/LoginPage';

import './App.css';

// 認証されたユーザー用レイアウト
const PrivateLayout = ({ userRole, children }) => (
  <div>
    <Navbar />
    {children}
  </div>
);

// 未認証ユーザー用レイアウト
const PublicLayout = ({ children }) => (
  <div>
    {children}
  </div>
);

function App() {
  const [userRole, setUserRole] = useState(null);// ユーザー権限の状態を管理

  return (
    <Router>
      <Routes>

        {/* メインページ */}
        <Route path='/' element={
          <PrivateLayout userRole={userRole}>
            {userRole === 'client' ? <ClientMainPage /> :
              userRole === 'provider' ? <ProviderMainPage /> :
                <Navigate to="/login" />}
          </PrivateLayout>
        } />

        {/* マイページ（ユーザOR店） */}
        <Route path='/mypage' element={
          <PrivateLayout userRole={userRole}>
            {userRole === 'client' ? <UserPage /> :
              userRole === 'provider' ? <StorePage /> :
                <Navigate to="/login" />}
          </PrivateLayout>
        } />

        {/* お知らせページ */}
        <Route path='/notification' element={
          <PrivateLayout userRole={userRole}>
            {userRole === 'client' ? <ClientNotificationPage /> :
              userRole === 'provider' ? <ProviderNotificationPage /> :
                <Navigate to="/login" />}
          </PrivateLayout>
        } />

        {/* ログインページ */}
        <Route path='/login' element={
          <PublicLayout>
            <LoginPage setUserRole={setUserRole} />
          </PublicLayout>
        } />

        {/* 間違えたURLで接近 */}
        <Route path='*' element={<Navigate to="/login" />} />

      </Routes>
    </Router>
  );
}

export default App;
