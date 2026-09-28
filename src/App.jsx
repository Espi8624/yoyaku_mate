import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';

import WaitingScreenFlow from './containers/waiting-screen/WaitingScreenFlow';
import Board from './containers/board/Board';
import PrivacyPolicyPage from './containers/legal/PrivacyPolicyPage';
import TermsOfServicePage from './containers/legal/TermsOfServicePage';
import DeleteAccountPage from './containers/legal/DeleteAccountPage';


function App() {
  return (
    <Router>
      <Routes>

        {/* メインページ */}
        <Route path='/' element={
          <h1>Rusui</h1>
        } />

        {/* 待ち画面:SPAフロー */}
        <Route path='/waiting-screen-flow'
          element={<WaitingScreenFlow />} />

        {/* 待機ボード（サイネージ用） */}
        <Route path='/board' element={<Board />} />

        {/* プライバシーポリシー: App Store Connect/Play Console登録用の公開ページ */}
        <Route path='/privacy' element={<PrivacyPolicyPage />} />

        {/* 利用規約: 公開ページ */}
        <Route path='/terms' element={<TermsOfServicePage />} />

        {/* アカウント・データ削除リクエスト: Google Playアカウント削除ポリシー対応の公開ページ */}
        <Route path='/delete-account' element={<DeleteAccountPage />} />

        {/* 間違えたURLで接近 */}
        <Route path='*' element={<Navigate to="/" />} />

      </Routes>
    </Router>
  );
}

export default App;
