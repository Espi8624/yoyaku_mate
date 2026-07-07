import React, { useEffect } from "react";

import { WaitingScreenProvider, useWaitingScreen } from "./WaitingScreenContext";
import WaitingScreenInput from "./waiting-screen-input/WaitingScreenInput";
import WaitingScreenMenu from "./waiting-screen-menu/WaitingScreenMenu";
import WaitingScreenPreview from "./waiting-screen-preview/WaitingScreenPreview";
// WaitingScreenFlow renders WaitingScreen, which renders content.
import WaitingScreen from "./waiting-screen/WaitingScreen";
import NotifiedScreen from "./waiting-screen-notified/NotifiedScreen";
import CancelledScreen from "./waiting-screen-cancelled/CancelledScreen";
import MapWindow from './map/MapWindow';
import { getWaitingDetails } from "../../api/waitingService";
import './ErrorScreen.css';
// Chatbot components
import ChatWindow from "../chat-bot/ChatWindow";

function FlowController() {
  const { step, setStep, storeId, setStoreId, setWaitingId, isCancelled, cancellationReason } = useWaitingScreen();

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
          if (details.status === 'notified') {
            // notifiedの場合はstep 3に復元 (WaitingScreenが起動後にモーダルを表示する)
            if (setStoreId) setStoreId(storedStoreId);
            if (setWaitingId) setWaitingId(storedWaitingId);
            if (setStep) setStep(3);
          } else if (details.status === 'completed') {
            // completedの場合はローカルストレージを保持し、完了画面を表示
            if (setStoreId) setStoreId(storedStoreId);
            if (setWaitingId) setWaitingId(storedWaitingId);
            // CancelledScreenを表示するためにreasonを設定したいが、
            // FlowController内ではContextの関数を直接呼べない(useEffect内)。
            // しかし、isCancelledがfalseのままだとWaitingScreenが表示される。
            // WaitingScreen側でstatus checkしてreasonを設定するロジックがあるため、
            // ここではstep 3に設定しておけば、WaitingScreenがマウントされ、
            // 即座にcompletedを検知してCancelledScreenに切り替わるはず。
            if (setStep) setStep(3);
          } else if (details.status === 'waiting') {
            // waitingの場合はローカルストレージを保持し、待機画面を表示
            if (setStoreId) setStoreId(storedStoreId);
            if (setWaitingId) setWaitingId(storedWaitingId);
            if (setStep) setStep(3);
          } else {
            // それ以外（cancelled, no_showなど）はローカルストレージをクリア
            // ただし、cancelledの場合もユーザーが確認するまでは保持すべきかもしれないが、
            // 現状の仕様ではクリアしてトップへ戻るようになっている。
            console.log(`[FlowController] ステータスが${details.status}のため、ローカルストレージをクリアします`);
            localStorage.removeItem("store_id");
            localStorage.removeItem("waiting_id");
            // step 1にリセット（新規登録可能な状態）
            if (setStep) setStep(1);
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

            // 開発環境での詳細情報出力
            const isDevelopment = process.env.NODE_ENV === 'development';

            if (isDevelopment) {
              console.group('⚠️ [開発モード] 復元エラー詳細');
              console.log('LocalStorage:', {
                store_id: storedStoreId,
                waiting_id: storedWaitingId,
                timestamp: localStorage.getItem('waiting_timestamp')
                  ? new Date(parseInt(localStorage.getItem('waiting_timestamp'))).toLocaleString()
                  : 'タイムスタンプなし'
              });
              console.log('Error Details:', {
                status: err?.response?.status,
                message: err?.message,
                responseData: err?.response?.data
              });
              console.warn('⚠️ Step 3 にフォールバックします。DBのデータを確認してください。');
              console.groupEnd();

              // モーダルで警告を表示
              const errorInfo = `復元エラーが発生しました\n\nStore ID: ${storedStoreId}\nWaiting ID: ${storedWaitingId}\nエラー: ${err?.response?.status || 'Network Error'}\n\nDBのデータを確認してください。`;
              setTimeout(() => alert(errorInfo), 100);
            }

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
  if (isCancelled || cancellationReason) {
    return <CancelledScreen reason={cancellationReason || 'user'} />;
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
  if (step === 5) {
    return <WaitingScreenMenu />;
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
  const content = <FlowController />;
  return (
    <WaitingScreenProvider>
      <div className="waiting-screen-container">
        {content}
        <ChatWindow />
        <MapWindow />
      </div>
    </WaitingScreenProvider>
  );
}

export default WaitingScreenFlow;