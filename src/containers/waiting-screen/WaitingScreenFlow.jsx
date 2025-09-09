import React from "react";

import { WaitingScreenProvider, useWaitingScreen } from "./WaitingScreenContext";
import WaitingScreenInput from "./waiting-screen-input/WaitingScreenInput";
import WaitingScreenPreview from "./waiting-screen-preview/WaitingScreenPreview";
import WaitingScreen from "./waiting-screen/WaitingScreen";
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
  const { step, storeId, isCancelled } = useWaitingScreen();

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