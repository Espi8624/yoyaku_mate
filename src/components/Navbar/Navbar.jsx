import { Link } from 'react-router-dom';

import './Navbar.css';

function Navbar() {
    return (
        <nav className="navbar">
            <div className="navbar-logo">
                <Link to="/">Yoyaku Mate</Link>
            </div>
            <div className="navbar-search">
                <input type='text' placeholder='Search...' />
            </div>
            <div className='navbar-icons'>
                <Link to='/notification' className='navbar-icon'>🔔</Link>
                <Link to='/mypage' className='navbar-icon'>👤</Link>
            </div>
        </nav>
    );
}

export default Navbar;