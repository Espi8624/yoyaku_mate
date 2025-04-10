import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

import './Navbar.css';

function Navbar() {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

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

    const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setIsDropdownOpen(false); // 드롭다운 외부 클릭 시 닫기
        }
    }

    useEffect(() => {
        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen]);

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
                <div
                    className='navbar-icon dropdown'
                    onClick={toggleDropdown}
                    ref={dropdownRef}
                >
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