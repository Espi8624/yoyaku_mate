import React, { useEffect } from "react";

import { WaitingScreenProvider, useWaitingScreen } from "./WaitingScreenContext";
import WaitingScreenInput from "./waiting-screen-input/WaitingScreenInput";
import WaitingScreenPreview from "./waiting-screen-preview/WaitingScreenPreview";
import WaitingScreen from "./waiting-screen/WaitingScreen";
import NotifiedScreen from "./waiting-screen-notified/NotifiedScreen";
import { getWaitingDetails } from "../../api/waitingService";
import './ErrorScreen.css';

// 取り消し完了画面
function CancellationCompleteView() {
  return (
    <div className="waiting-section success-section">
      <svg className="success-icon" /* ... 今後アイコン追加 ... */ > ... </svg>
      <h2>キャンセルされました</h2>
      <p>ご利用ありがとうございました。再度ご利用の場合は、もう一度QRコードをスキャンしてください。</p>
    </div>
  );
}

function FlowController() {
  const { step, setStep, storeId, setStoreId, waitingId, setWaitingId, isCancelled } = useWaitingScreen();

  // ローカルストレージから復元し、ステータスを確認してから復元するか判断
  useEffect(() => {
    const checkAndRestore = async () => {
      const storedStoreId = localStorage.getItem("store_id");
      const storedWaitingId = localStorage.getItem("waiting_id");
      
      if (storedStoreId && storedWaitingId) {
        try {
          // サーバーから最新のステータスを取得
          const details = await getWaitingDetails(storedStoreId, storedWaitingId);
          
          // completed, cancelledの場合はローカルストレージをクリア
          if (details.status === 'completed' || details.status === 'cancelled') {
            console.log(`[FlowController] ステータスが${details.status}のため、ローカルストレージをクリアします`);
            localStorage.removeItem("store_id");
            localStorage.removeItem("waiting_id");
            // step 1にリセット（新規登録可能な状態）
            if (setStep) setStep(1);
          } else if (details.status === 'notified') {
            // notifiedの場合はstep 4に復元
            if (setStoreId) setStoreId(storedStoreId);
            if (setWaitingId) setWaitingId(storedWaitingId);
            if (setStep) setStep(4);
          } else {
            // waiting または called の場合はstep 3に復元
            if (setStoreId) setStoreId(storedStoreId);
            if (setWaitingId) setWaitingId(storedWaitingId);
            if (step !== 3 && setStep) setStep(3);
          }
        } catch (err) {
          // 404エラー（データが存在しない）の場合もクリア
          if (err?.response?.status === 404 || err?.response?.status === 410) {
            console.log('[FlowController] データが存在しないため、ローカルストレージをクリアします');
            localStorage.removeItem("store_id");
            localStorage.removeItem("waiting_id");
            if (setStep) setStep(1);
          } else {
            console.error('[FlowController] ステータス確認エラー:', err);
            // エラーの場合は一旦復元を試みる
            if (setStoreId) setStoreId(storedStoreId);
            if (setWaitingId) setWaitingId(storedWaitingId);
            if (step !== 3 && setStep) setStep(3);
          }
        }
      }
    };

    checkAndRestore();
  // eslint-disable-next-line
  }, []);

  // isCancelledがtrueの場合、取消完了画面を最優先で表示
  if (isCancelled) {
    return <CancellationCompleteView />;
  }

  // storeIdの状態確認
  if (!storeId) {
    return (
      <div className="waiting-section error-section">
        <h2>不正なアクセスです</h2>
        <p>QRコードを再度スキャンするか、正しいURLでアクセスしてください。</p>
      </div>
    );
  }

  if (step === 1) {
    return <WaitingScreenInput />;
  }
  if (step === 2) {
    return <WaitingScreenPreview />;
  }
  if (step === 3) {
    return <WaitingScreen />;
  }
  if (step === 4) {
    return <NotifiedScreen />;
  }
  return <div>Loading...</div>;
}

function WaitingScreenFlow() {
  return (
    <WaitingScreenProvider>
      <FlowController />
    </WaitingScreenProvider>
  );
}

export default WaitingScreenFlow;