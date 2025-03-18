
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import Navbar from './components/Navbar/Navbar';

import './App.css';
import MainPage from './containers/MainPage/MainPage';
import UserPage from './containers/UserPage/UserPage';
import NotificationPage from './containers/NotificationPage/NotificationPage';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path='/' element={<MainPage />}></Route>
          <Route path='/user' element={<UserPage />}></Route>
          <Route path='/notification' element={<NotificationPage />}></Route>
        </Routes>
      </div>
    </Router>

  );
}

export default App;
