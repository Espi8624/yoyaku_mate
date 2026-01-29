import React, { useState, useEffect, useRef } from 'react';
import { useWaitingScreen } from '../waiting-screen/WaitingScreenContext';
import { getStoreAIContext } from '../../api/waitingService';
// import { GEMINI_API_KEY } from '../../config'; // config.js might be missing in production
import { generateSystemPrompt } from './SystemPrompt';
import useTranslation from '../../hook/useTranslation';
import './ChatWindow.css';

const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

const ChatWindow = () => {
    const { isChatOpen, toggleChat, storeId, selectedNationality, selectedLanguageCode, currentPage } = useWaitingScreen();

    const t = useTranslation(selectedLanguageCode);
    const chatBotText = t.chat_bot || {}; // Fallback if missing
    const uiText = chatBotText.ui || { title: "AI Assistant", placeholder: "Type a message..." };

    const [messages, setMessages] = useState([]);

    // Update greeting when chat opens or language changes
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([{ id: 1, text: chatBotText.greeting || "Hello", sender: 'bot' }]);
        }
    }, [selectedLanguageCode, messages.length, chatBotText.greeting]);

    const [inputText, setInputText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);


    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isChatOpen]);



    const callGemini = async (userMessage) => {
        if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_API_KEY_HERE") {
            // If env var is missing in production, this error will show.
            return "API Keyが設定されていません。環境変数 REACT_APP_GEMINI_API_KEY を確認してください。";
        }

        try {
            // 1. リアルタイム店舗コンテキストを取得
            let liveContext = {};
            try {
                liveContext = await getStoreAIContext(storeId);
            } catch (e) {
                console.error("Failed to fetch live context", e);
                // フォールバックまたは空のコンテキスト
            }

            // 2. 動的プロンプトを構築 (SystemPrompt.jsから生成)
            const systemPrompt = generateSystemPrompt(liveContext, selectedNationality, selectedLanguageCode, currentPage);

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [
                        {
                            role: "user",
                            parts: [{ text: systemPrompt + "\n\nお客様: " + userMessage }]
                        }
                    ]
                })
            });
            if (response.status === 429) {
                return chatBotText.errors?.['429'] || "Busy.";
            }
            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || "すみません、うまく聞き取れませんでした。";
        } catch (error) {
            console.error("Gemini API Error:", error);
            return chatBotText.errors?.general || "Error.";
        }
    };

    const inputRef = useRef(null);

    // Auto-resize textarea
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.height = "auto";
            inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`; // Max height 120px
        }
    }, [inputText]);

    const handleInputChange = (e) => {
        setInputText(e.target.value);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend(e);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const userText = inputText;
        const newUserMsg = { id: Date.now(), text: userText, sender: 'user' };

        setMessages(prev => [...prev, newUserMsg]);
        setInputText("");
        setIsLoading(true);

        // Reset height immediately after send
        if (inputRef.current) {
            inputRef.current.style.height = "auto";
        }

        const aiResponseText = await callGemini(userText);

        const botResponse = {
            id: Date.now() + 1,
            text: aiResponseText,
            sender: 'bot'
        };
        setMessages(prev => [...prev, botResponse]);
        setIsLoading(false);
    };

    if (!isChatOpen) return null;



    return (
        <div className="chat-window">
            <div className="chat-header">
                <span className="chat-title">{uiText.title}</span>
                <button className="close-button" onClick={toggleChat}>×</button>
            </div>

            <div className="chat-messages">
                {messages.map(msg => (
                    <div key={msg.id} className={`message ${msg.sender}`}>
                        {msg.text}
                    </div>
                ))}
                {isLoading && <div className="message bot">...</div>}
                <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-area" onSubmit={handleSend}>
                <textarea
                    ref={inputRef}
                    className="chat-input"
                    placeholder={uiText.placeholder}
                    value={inputText}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    rows={1}
                />
                <button type="submit" className="send-button" disabled={!inputText.trim() || isLoading}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                    </svg>
                </button>
            </form>
        </div>
    );
};

export default ChatWindow;
