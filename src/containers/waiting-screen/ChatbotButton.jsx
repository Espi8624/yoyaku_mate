import React from 'react';
import { useWaitingScreen } from './WaitingScreenContext';
import './ChatbotButton.css';

const ChatbotButton = () => {
    const { storeId } = useWaitingScreen();

    // storeIdがない場合（不正アクセスなど）は表示しない
    if (!storeId) {
        return null;
    }

    const handleClick = () => {
        // 将来的にチャットボット機能を開く処理をここに実装
        console.log("Chatbot button clicked");
    };

    return (
        <button className="chatbot-button" onClick={handleClick} aria-label="チャットボットを開く">
            <svg className="chatbot-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
                <path d="M7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z" />
            </svg>
        </button>
    );
};

export default ChatbotButton;
