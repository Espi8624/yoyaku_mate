import React from 'react';
import './BackButton.css';

const BackButton = ({ onClick, className = '' }) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`common-back-btn ${className}`}
            aria-label="Back"
        >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z" fill="#333" />
            </svg>
        </button>
    );
};

export default BackButton;
