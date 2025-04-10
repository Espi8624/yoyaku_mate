
import { Children, useState } from 'react';
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

// 인증된 사용자용 레이아웃웃
const PrivateLayout = ({ userRole, children }) => (
  <div>
    <Navbar />
    {children}
  </div>
);

const PublicLayout = ({ children }) => (
  <div>
    {children}
  </div>
);

function App() {
  const [userRole, setUserRole] = useState(null);

  return (
    <Router>
      <Routes>

        <Route path='/login' element={
          <PublicLayout>
            <LoginPage setUserRole={setUserRole} />
          </PublicLayout>
        } />
        
        <Route path='*' element={<Navigate to="/login" />} />

        <Route path='/' element={
          <PrivateLayout userRole={userRole}>
            {userRole === 'client' ? <ClientMainPage /> :
              userRole === 'provider' ? <ProviderMainPage /> :
                <Navigate to="/login" />}
          </PrivateLayout>
        } />

        <Route path='/mypage' element={
          <PrivateLayout userRole={userRole}>
            {userRole === 'client' ? <UserPage /> :
              userRole === 'provider' ? <StorePage /> :
                <Navigate to="/login" />}
          </PrivateLayout>
        } />

        <Route path='/notification' element={
          <PrivateLayout userRole={userRole}>
            {userRole === 'client' ? <ClientNotificationPage /> :
              userRole === 'provider' ? <ProviderNotificationPage /> :
                <Navigate to="/login" />}
          </PrivateLayout>
        } />

      </Routes>
    </Router>
  );
}

export default App;
