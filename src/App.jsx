
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

function App() {
  // 임시 권한 설정
  const [userRole, setUserRole] = useState(null); // 'client' or 'provider'

  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path='/' element={
            userRole === 'client' ? (
              <ClientMainPage />
            ) : userRole === 'provider' ? (
              <ProviderMainPage />
            ) : (
              <Navigate to="/login" />
            )
          }
          ></Route>

          <Route path='/mypage' element={
            userRole === 'client' ? (
              <UserPage />
            ) : userRole === 'provider' ? (
              <StorePage />
            ) : (
              <Navigate to="/login" />
            )
          }
          ></Route>

          <Route path='/notification' element={
            userRole === 'client' ? (
              <ClientNotificationPage />
            ) : userRole === 'provider' ? (
              <ProviderNotificationPage />
            ) : (
              <Navigate to="/login" />
            )
          }
          ></Route>

          <Route path='/login' element={<LoginPage setUserRole={setUserRole} />} />

          {/* <Route path='/'></Route> */}
          <Route path='*' element={<Navigate to="/login" />}></Route>
        </Routes>
      </div>
    </Router>

  );
}

export default App;
