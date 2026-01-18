import React from 'react';
import './CommonPopup.css';

const CommonPopup = ({ isOpen = true, onClose, message, actions, closeLabel = "閉じる", showCloseButton = true }) => {
    if (!isOpen) return null;

    return (
        <div className="common-popup-overlay">
            <div className="common-popup-modal">
                {showCloseButton && onClose && (
                    <button
                        className="common-popup-close-btn"
                        onClick={onClose}
                        aria-label={closeLabel}
                        type="button"
                    >
                        ×
                    </button>
                )}
                <div className="common-popup-message">
                    {message}
                </div>
                {actions && (
                    <div className="common-popup-actions">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommonPopup;
