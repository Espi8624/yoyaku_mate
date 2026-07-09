import React, { useEffect } from "react";
import { useWaitingScreen } from "../WaitingScreenContext";
import { getWaitingDetails, subscribeToWaitingStatus } from "../../../api/waitingService";
import useTranslation from "../../../hook/useTranslation";
import ChatbotButton from "../../chat-bot/ChatbotButton";
import "../waiting-screen/WaitingScreen.css";
import "./NotifiedScreen.css";

function NotifiedScreen() {
  const { storeId, waitingId, setStep, selectedLanguageCode } = useWaitingScreen();


  const t = useTranslation(selectedLanguageCode);
  const notifiedText = t.waiting_screen_notified || { title: "大変お待たせいたしました。", message: "只今ご案内いたします。" };

  // completedステータスをSSEで監視
  useEffect(() => {
    if (!storeId || !waitingId) return;

    const handleCompletion = () => {
      console.log('[NotifiedScreen] 入店完了のため、ローカルストレージをクリアします');
      localStorage.removeItem("store_id");
      localStorage.removeItem("waiting_id");

      // step 1にリセット（新規登録可能な状態）
      if (setStep) {
        setStep(1);
      }
    };

    const checkStatus = async () => {
      try {
        const details = await getWaitingDetails(storeId, waitingId);
        console.log('[NotifiedScreen] 初期ステータス:', details.status);

        if (details.status === 'completed') {
          handleCompletion();
        }
      } catch (err) {
        console.error('[NotifiedScreen] ステータス確認エラー:', err);
      }
    };

    // 初回チェック
    checkStatus();

    // SSE購読
    const eventSource = subscribeToWaitingStatus(
      storeId,
      waitingId,
      (updatedDetails) => {
        console.log('[NotifiedScreen] SSE受信 status:', updatedDetails.status);
        if (updatedDetails.status === 'completed') {
          handleCompletion();
        }
      },
      (error) => {
        console.error('[NotifiedScreen] SSE接続エラー:', error);
      }
    );

    return () => {
      eventSource.close();
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