import React from "react";
import { useWaitingScreen } from "../WaitingScreenContext";
import CommonPopup from "../../../components/CommonPopup";

function CongestionPopup() {
  // Contextから必要なものを持ってくる
  const {
    popupInfo,
    closePopupAndProceed,
    closePopupOnly,
    t // 다국어 데이터를 가져옵니다.
  } = useWaitingScreen();

  // 多国語データ呼出
  const popupTexts = t.waiting_screen_preview.popup;

  const actions = (
    <button
      className="confirmation-btn"
      onClick={closePopupAndProceed}
    >
      {/* 「最大人員超過」時、戻るボタン、その外確認ボタンを表示 */}
      {popupInfo.mode === "max" ? popupTexts.back : popupTexts.confirm}
    </button>
  );

  return (
    <CommonPopup
      isOpen={true} // CongestionPopup is conditionally rendered by parent, so always true if mounted
      onClose={popupInfo.mode !== "max" ? closePopupOnly : undefined}
      closeLabel={popupTexts.close}
      message={popupInfo.message}
      actions={actions}
      showCloseButton={popupInfo.mode !== "max"}
    />
  );
}

export default CongestionPopup;