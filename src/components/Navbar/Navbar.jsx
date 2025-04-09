import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

import './Navbar.css';

function Navbar() {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const navigate = useNavigate();

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const handleLogout = () => {
        // Perform logout logic here
        console.log('User logged out');
        // Redirect to login page after logout
        navigate('/login');
        setIsDropdownOpen(false);
    }

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
                <div className='navbar-icon dropdown' onClick={toggleDropdown}>
                    👤
                    {isDropdownOpen && (
                        <div className='dropdown-menu'>
                            <Link to='/mypage' className='dropdown-item box-item'>My Page</Link>
                            <button onClick={handleLogout} className='dropdown-item box-item'>Logout</button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default Navbar;