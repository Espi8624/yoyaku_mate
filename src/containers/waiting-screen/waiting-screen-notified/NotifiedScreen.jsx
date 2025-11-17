// src/containers/waiting-screen/waiting-screen-notified/NotifiedScreen.jsx
import React, { useState, useEffect, useRef } from "react";
import { useWaitingScreen } from "../WaitingScreenContext";
import { getWaitingDetails } from "../../../api/waitingService";
import "./NotifiedScreen.css";

function NotifiedScreen() {
  const { storeId, waitingId, setStep } = useWaitingScreen();
  const pollingRef = useRef(null);

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
    <div className="notified-screen">
      <div className="notified-content">
        <div className="notified-icon">✓</div>
        <h1 className="notified-title">大変お待たせいたしました。</h1>
        <p className="notified-message">只今ご案内いたします。</p>
      </div>
    </div>
  );
}

export default NotifiedScreen;