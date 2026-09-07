import React, { useEffect } from "react";
import { useWaitingScreen } from "../WaitingScreenContext";
import { getWaitingDetails, subscribeToWaitingStatus } from "../../../api/waitingService";
import { debugLog } from "../../../utils/debugLog";
import useTranslation from "../../../hook/useTranslation";
import ChatbotButton from "../../chat-bot/ChatbotButton";
import baseStyles from "../waiting-screen/WaitingScreen.module.css";
import specificStyles from "./NotifiedScreen.module.css";
const styles = { ...baseStyles, ...specificStyles };

function NotifiedScreen() {
  const { storeId, waitingId, setStep, selectedLanguageCode } = useWaitingScreen();


  const t = useTranslation(selectedLanguageCode);
  const notifiedText = t.waiting_screen_notified || { title: "大変お待たせいたしました。", message: "只今ご案内いたします。" };

  // completedステータスをSSEで監視
  useEffect(() => {
    if (!storeId || !waitingId) return;

    const handleCompletion = () => {
      debugLog('[NotifiedScreen] 入店完了のため、ローカルストレージをクリアします');
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
        debugLog('[NotifiedScreen] 初期ステータス:', details.status);

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
        debugLog('[NotifiedScreen] SSE受信 status:', updatedDetails.status);
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
    <div className="page-container">
      <div className="page-top-bar">
        <div className="page-top-bar-right">
          <ChatbotButton />
        </div>
      </div>
      <div className={styles["notified-content"]}>
        <div className={styles["notified-icon"]}>✓</div>
        <h1 className={styles["notified-title"]}>{notifiedText.title}</h1>
        <p className={styles["notified-message"]}>{notifiedText.message}</p>
      </div>
    </div>
  );
}

export default NotifiedScreen;