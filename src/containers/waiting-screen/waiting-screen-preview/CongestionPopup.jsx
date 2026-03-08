import React from "react";
import { useWaitingScreen } from "../WaitingScreenContext";
import CommonPopup from "../../../components/CommonPopup";

function CongestionPopup() {
  // Contextから必要なものを持ってくる
  const {
    popupInfo,
    closePopupAndProceed,
    closePopupOnly,
    resetApp, // Add resetApp
    t // 다국어 데이터를 가져옵니다.
  } = useWaitingScreen();

  // 多国語データ呼出
  const popupTexts = t?.waiting_screen_preview?.popup || {};

  let actions = (
    <button
      className="confirmation-btn"
      onClick={closePopupAndProceed}
    >
      {/* 「最大人員超過」時、戻るボタン、その外確認ボタンを表示 */}
      {popupInfo.mode === "max" ? popupTexts.back : popupTexts.confirm}
    </button>
  );

  // 登録完了通知の場合、OKボタンのみ表示
  if (popupInfo.mode === "registration_complete") {
    actions = (
      <button
        className="confirmation-btn"
        onClick={closePopupAndProceed}
        style={{ width: '100%', margin: 0 }}
      >
        OK
      </button>
    );
  }

  // 入店完了通知の場合、閉じるボタンと初期化ボタンを表示
  if (popupInfo.mode === "completed_notification") {
    actions = (
      <>
        {/* 1. 閉じるボタン (メインアクション: 画面維持) */}
        <button
          className="confirmation-btn"
          onClick={closePopupOnly}
          style={{ width: '100%', margin: 0 }}
        >
          {popupTexts.close || "Close"}
        </button>

        {/* 区切り線 */}
        <div style={{ width: '100%', height: '1px', backgroundColor: '#e0e0e0', margin: '16px 0' }} />

        {/* 2. 初期化エリア (案内テキスト + ボタン) - グループ化して余白調整 (gap: 8px -> 24px) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '12px', width: '100%' }}>
          <span style={{ fontSize: '15px', color: '#666', textAlign: 'center', display: 'block', margin: 0 }}>
            {t.waiting_screen?.reset_confirm_text || "初期化をご希望の場合は下のボタンを押してください。"}
          </span>

          <button
            className="confirmation-btn secondary-btn"
            onClick={resetApp}
            style={{ width: '100%', backgroundColor: '#dc3545', margin: 0, border: 'none', fontSize: '1em' }}
          >
            {t.waiting_screen?.reset_btn || "Reset"}
          </button>
        </div>
      </>
    );
  }

  return (
    <CommonPopup
      isOpen={true} // CongestionPopup is conditionally rendered by parent, so always true if mounted
      onClose={popupInfo.mode !== "max" && popupInfo.mode !== "registration_complete" ? closePopupOnly : undefined}
      closeLabel={popupTexts.close}
      message={popupInfo.message}
      actions={actions}
      showCloseButton={popupInfo.mode !== "max" && popupInfo.mode !== "registration_complete"}
    />
  );
}

export default CongestionPopup;