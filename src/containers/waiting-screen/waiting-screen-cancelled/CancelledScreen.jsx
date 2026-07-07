import React from "react";
import "../waiting-screen/WaitingScreen.css";
import "../ErrorScreen.css";
import ChatbotButton from "../../chat-bot/ChatbotButton";
import { useWaitingScreen } from "../WaitingScreenContext";
import useTranslation from "../../../hook/useTranslation";

const CancelledScreen = ({ reason }) => {
    const { selectedLanguageCode } = useWaitingScreen();
    const t = useTranslation(selectedLanguageCode);

    const content = t.cancelled_screen || {
        // Fallback (Japanese)
        user: {
            title: "キャンセルされました",
            body: "ご利用ありがとうございました。再度ご利用の場合は、もう一度QRコードをスキャンしてください。",
        },
        store: {
            title: "キャンセルされました",
            body: "大変申し訳ございません。店舗の都合によりキャンセルされました。スタッフまでお問い合わせください。",
        },
        absence: {
            title: "キャンセルされました",
            body: "お呼び出しいたしましたが、ご不在のためキャンセルされました。再度お待ちになる場合は、もう一度QRコードをスキャンしてください。",
        },
    };

    // ★ completed (入店完了) の場合は waiting_screen のテキストを使用
    if (reason === 'completed') {
        const completedInfo = t.waiting_screen?.completed_screen || {
            title: "ご来店ありがとうございます！",
            message: "スタッフがご案内いたします。"
        };
        return (
            <div className="waiting-section success-section">
                <ChatbotButton />
                <h2>{completedInfo.title}</h2>
                <p>{completedInfo.message}</p>
            </div>
        );
    }

    const info = content[reason] || content.user;

    return (
        <div className="waiting-section success-section">
            <ChatbotButton />
            <h2>{info.title}</h2>
            <p>{info.body}</p>
        </div>
    );
};

export default CancelledScreen;
