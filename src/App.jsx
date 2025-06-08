
import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';

import Navbar from './components/Navbar/Navbar';

import CustomerMainPage from './containers/CustomerPage/MainPage/MainPage';
import ProviderMainPage from './containers/ProviderPage/MainPage/MainPage';

import CustomerPage from './containers/CustomerPage/CustomerPage/CustomerPage';
import StorePage from './containers/ProviderPage/StorePage/StorePage';

import CustomerNotificationPage from './containers/CustomerPage/NotificationPage/NotificationPage';
import ProviderNotificationPage from './containers/ProviderPage/NotificationPage/NotificationPage';

import StoreInfoPage from './containers/CommonPage/StoreInfoPage/StoreInfoPage';
import ReservationDetails from './containers/CommonPage/ReservationDetails/ReservationDetails';

import LoginPage from './containers/CommonPage/LoginPage/LoginPage';

import './App.css';
import PastReservationDetails from './containers/CommonPage/PastReservationDetails/PastReservationDetails';

import AllReservation from './containers/CustomerPage/AllReservation/AllReservation';
import AllVisitedPlaces from './containers/CustomerPage/AllVisitedPlaces/AllVisitedPlaces';
import WatingScreen from './containers/CommonPage/WatingScreen/WatingScreen';
import WatingStoreInfo from './containers/CommonPage/WatingStoreInfo/WatingStoreInfo';
import WatingUserInfo from './containers/CommonPage/WatingUserInfo/WatingUserInfo';

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
  // const [userRole, setUserRole] = useState(null);// ユーザー権限の状態を管理
  const [userRole, setUserRole] = useState(() => {
    return sessionStorage.getItem('userRole') || null;
  });

  // userRoleが変更される時にlocalStorageに保存
  // 今後Cookie又はサーバーセッションに変更する予定
  useEffect(() => {
    if (userRole) {
      sessionStorage.setItem('userRole', userRole);
    } else {
      sessionStorage.removeItem('userRole'); // ログアウト時、削除
    }
  }, [userRole]);

  return (
    <Router>
      <Routes>

        {/* メインページ */}
        <Route path='/' element={
          <PrivateLayout userRole={userRole}>
            {userRole === 'customer' ? <CustomerMainPage /> :
              userRole === 'provider' ? <ProviderMainPage /> :
                <Navigate to="/login" />}
          </PrivateLayout>
        } />

        {/* マイページ（ユーザOR店） */}
        <Route path='/mypage' element={
          <PrivateLayout userRole={userRole}>
            {userRole === 'customer' ? <CustomerPage /> :
              userRole === 'provider' ? <StorePage /> :
                <Navigate to="/login" />}
          </PrivateLayout>
        } />

        {/* お知らせページ */}
        <Route path='/notification' element={
          <PrivateLayout userRole={userRole}>
            {userRole === 'customer' ? <CustomerNotificationPage /> :
              userRole === 'provider' ? <ProviderNotificationPage /> :
                <Navigate to="/login" />}
          </PrivateLayout>
        } />

        {/* 店情報ページ */}
        <Route path='/store/:storeId' element={
          <PrivateLayout>
            <StoreInfoPage />
          </PrivateLayout>
        } />

        {/* 予約詳細ページ */}
        <Route path='/reservation/:id' element={
          <PrivateLayout>
            <ReservationDetails />
          </PrivateLayout>
        } />

        {/* 過去予約詳細ページ */}
        <Route path='/past-reservation/:reservationId' element={
          <PrivateLayout>
            <PastReservationDetails />
          </PrivateLayout>
        } />

        {/* ログインページ */}
        <Route path='/login' element={
          <PublicLayout>
            <LoginPage setUserRole={setUserRole} />
          </PublicLayout>
        } />

        {/* すべての予約ページ */}
        <Route path='/all-reservation/:userId' element={
          <PrivateLayout>
            <AllReservation />
          </PrivateLayout>
        } />

        {/* すべての訪問した場所ページ */}
        <Route path='/all-visited-places/:userId' element={
          <PrivateLayout>
            <AllVisitedPlaces />
          </PrivateLayout>
        } />

        {/* 待ち画面 */}
        <Route path='/wating-screen' element={
          <PublicLayout>
            <WatingScreen />
          </PublicLayout>
        } />

        {/* 待ち予約者情報 */}
        <Route path='/wating-user-info' element={
          <PublicLayout>
            <WatingUserInfo />
          </PublicLayout>
        } />

        {/* 待ち店情報 */}
        <Route path='/wating-store-info' element={
          <PublicLayout>
            <WatingStoreInfo />
          </PublicLayout>
        } />

        {/* 間違えたURLで接近 */}
        <Route path='*' element={<Navigate to="/login" />} />

      </Routes>
    </Router>
  );
}

export default App;
