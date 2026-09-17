import React from "react";

import { WaitingScreenProvider, useWaitingScreen } from "./WaitingScreenContext";
import WaitingScreenInput from "./waiting-screen-input/WaitingScreenInput";
import WaitingScreenMenu from "./waiting-screen-menu/WaitingScreenMenu";
import WaitingScreenPreview from "./waiting-screen-preview/WaitingScreenPreview";
// WaitingScreenFlow renders WaitingScreen, which renders content.
import WaitingScreen from "./waiting-screen/WaitingScreen";
import CancelledScreen from "./waiting-screen-cancelled/CancelledScreen";
import MapWindow from './map/MapWindow';
// Chatbot components
import ChatWindow from "../chat-bot/ChatWindow";

function FlowController() {
  const { step, storeId, isCancelled, cancellationReason } = useWaitingScreen();

  // 保存済みIDからの復元と、サーバーのステータス監視は WaitingScreenProvider が担当する。
  // ・以前はここでも getWaitingDetails を呼んで step を決め直していたため、
  //   WaitingScreen 側の監視と合わせて同じデータを2回取得していた

  // 取消完了画面を最優先で表示
  if (isCancelled || cancellationReason) {
    return <CancelledScreen reason={cancellationReason || 'user'} />;
  }

  // storeIdの状態確認
  if (!storeId) {
    return (
      <div className="page-container">
        <h2>不正なアクセスです</h2>
        <p>QRコードを再度スキャンするか、正しいURLでアクセスしてください。</p>
      </div>
    );
  }

  // step 1/2/5 は登録ウィザード、step 3 は登録後の待機画面
  // ・入店完了(completed)後も待機画面のままにしている。
  //   着席後もメニューを確認できるようにするための意図的な仕様
  if (step === 2) {
    return <WaitingScreenPreview />;
  }
  if (step === 5) {
    return <WaitingScreenMenu />;
  }
  if (step === 3) {
    return <WaitingScreen />;
  }
  return <WaitingScreenInput />;
}

function WaitingScreenFlow() {
  const content = <FlowController />;
  // ★ 各ステップのコンポーネント(WaitingScreenInput/WaitingScreen等)は
  // 自身で "page-container" を描画するため、ここで重ねて包むと
  // page-containerが二重にネストされ、背景色やpaddingが二重に適用されてしまう。
  // ChatWindow/MapWindowはposition:fixedなのでレイアウト上の親要素は不要 → Fragmentで包むだけにする
  return (
    <WaitingScreenProvider>
      {content}
      <ChatWindow />
      <MapWindow />
    </WaitingScreenProvider>
  );
}

export default WaitingScreenFlow;