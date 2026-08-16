import React from 'react';
import styles from "./CommonPopup.module.css";

const CommonPopup = ({ isOpen = true, onClose, message, actions, closeLabel = "閉じる", showCloseButton = true }) => {
    if (!isOpen) return null;

    return (
        <div className={styles["common-popup-overlay"]}>
            <div className={styles["common-popup-modal"]}>
                {showCloseButton && onClose && (
                    <button
                        className={styles["common-popup-close-btn"]}
                        onClick={onClose}
                        aria-label={closeLabel}
                        type="button"
                    >
                        ×
                    </button>
                )}
                <div className={styles["common-popup-message"]}>
                    {message}
                </div>
                {actions && (
                    <div className={styles["common-popup-actions"]}>
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommonPopup;
