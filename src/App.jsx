
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';

import Navbar from './components/Navbar/Navbar';

import ClientMainPage from './containers/ClientPage/MainPage/MainPage';
import ProviderMainPage from './containers/ProviderPage/MainPage/MainPage';

import UserPage from './containers/ClientPage/UserPage/UserPage';
import StorePage from './containers/ProviderPage/StorePage/StorePage';

import ClientNotificationPage from './containers/ClientPage/NotificationPage/NotificationPage';
import ProviderNotificationPage from './containers/ProviderPage/NotificationPage/NotificationPage';

import './App.css';

function App() {
  // 임시 권한 설정
  const user = { role: 'provider' };

  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path='/' element={
            user.role === 'client' ? (
              <ClientMainPage />
            ) : user.role === 'provider' ? (
              <ProviderMainPage />
            ) : (
              <Navigate to="/" />
            )
          }
          ></Route>

          <Route path='/mypage' element={
            user.role === 'client' ? (
              <UserPage />
            ) : user.role === 'provider' ? (
              <StorePage />
            ) : (
              <Navigate to="/" />
            )
          }
          ></Route>

          <Route path='/notification' element={
            user.role === 'client' ? (
              <ClientNotificationPage />
            ) : user.role === 'provider' ? (
              <ProviderNotificationPage />
            ) : (
              <Navigate to="/" />
            )
          }
          ></Route>

          <Route path='/'></Route>
        </Routes>
      </div>
    </Router>

  );
}

export default App;
