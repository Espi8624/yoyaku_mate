import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';

import './App.css';
import WaitingScreenFlow from './containers/waiting-screen/WaitingScreenFlow';


function App() {
  return (
    <Router>
      <Routes>

        {/* メインページ */}
        <Route path='/' element={
          <h1>Yoyaku Mate</h1>
        } />

        {/* 待ち画面:SPAフロー */}
        <Route path='/waiting-screen-flow' element={
            <WaitingScreenFlow />
        } />

        {/* 間違えたURLで接近 */}
        <Route path='*' element={<Navigate to="/" />} />

      </Routes>
    </Router>
  );
}

export default App;
