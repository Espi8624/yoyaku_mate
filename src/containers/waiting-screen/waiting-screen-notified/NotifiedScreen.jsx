import React, { useEffect, useRef } from "react";
import { useWaitingScreen } from "../WaitingScreenContext";
import { getWaitingDetails } from "../../../api/waitingService";
import useTranslation from "../../../hook/useTranslation";
import ChatbotButton from "../../chat-bot/ChatbotButton";
import "../waiting-screen/WaitingScreen.css";
import "./NotifiedScreen.css";

function NotifiedScreen() {
  const { storeId, waitingId, setStep, selectedLanguageCode } = useWaitingScreen();
  const pollingRef = useRef(null);

  const t = useTranslation(selectedLanguageCode);
  const notifiedText = t.waiting_screen_notified || { title: "大変お待たせいたしました。", message: "只今ご案内いたします。" };

  // completedステータスをポーリングで監視
  useEffect(() => {
    if (!storeId || !waitingId) return;

    const checkStatus = async () => {
      try {
        const details = await getWaitingDetails(storeId, waitingId);
        console.log('[NotifiedScreen] status:', details.status);

        // completedになったらローカルストレージをクリアしてstep 1に
        if (details.status === 'completed') {
          console.log('[NotifiedScreen] 入店完了のため、ローカルストレージをクリアします');
          localStorage.removeItem("store_id");
          localStorage.removeItem("waiting_id");
          localStorage.removeItem("v_token");

          // ポーリング停止
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
          }

          // step 1にリセット（新規登録可能な状態）
          if (setStep) {
            setStep(1);
          }
        }
      } catch (err) {
        console.error('[NotifiedScreen] ステータス確認エラー:', err);
      }
    };

    // 初回チェック
    checkStatus();

    // 5秒ごとにポーリング
    pollingRef.current = setInterval(checkStatus, 5000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [storeId, waitingId, setStep]);

  return (
    <div className="waiting-section notified-section">
      <ChatbotButton />
      <div className="notified-content">
        <div className="notified-icon">✓</div>
        <h1 className="notified-title">{notifiedText.title}</h1>
        <p className="notified-message">{notifiedText.message}</p>
      </div>
    </div>
  );
}

export default NotifiedScreen;