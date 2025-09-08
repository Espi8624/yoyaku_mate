import React from "react";
import { useWaitingScreen } from "../WaitingScreenContext";
import "./WaitingScreenPreview.css";

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

  return (
    <div className="congestion-popup-overlay">
      <div className="congestion-popup-modal">
        {/* 「最大人員超過」で無い場合のみ、閉じるボタンを表示 */}
        {popupInfo.mode !== "max" && (
           <button
            className="congestion-popup-close-btn"
            onClick={closePopupOnly} 
            aria-label={popupTexts.close}
          >
            ×
          </button>
        )}
       
        <div className="congestion-popup-message">
          {/* Contextで受けたメッセージを表示 */}
          {popupInfo.message.split('\n').map((line, index) => (
            <React.Fragment key={index}>
              {line}
              <br />
            </React.Fragment>
          ))}
        </div>
        
        <div className="congestion-popup-actions">
          <button
            className="confirmation-btn"
            onClick={closePopupAndProceed}
          >
            {/* 「最大人員超過」時、戻るボタン、その外確認ボタンを表示 */}
            {popupInfo.mode === "max" ? popupTexts.back : popupTexts.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CongestionPopup;