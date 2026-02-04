import React from "react";
import { useWaitingScreen } from "../WaitingScreenContext";
import useTranslation from "../../../hook/useTranslation";
import CongestionPopup from "./CongestionPopup";
import BackButton from "../../../components/BackButton";
import { getTranslatedText } from "../../../utils/i18nHelper";
import "./WaitingScreenPreview.css";

function WaitingScreenPreview() {
  const {
    partySize,
    contact,
    notes,
    selectedLanguageCode,
    handleSubmitWaiting,
    isPopupVisible,
    selectedMenus,
    enableMenuSelection,
    setStep
  } = useWaitingScreen();

  const t = useTranslation(selectedLanguageCode);
  const watingScreenPreview = t.waiting_screen_preview;

  return (
    <div className="waiting-section">
      <div className="preview-header-row" style={{ display: 'flex', alignItems: 'center', marginBottom: '18px' }}>
        <BackButton onClick={() => {
          if (enableMenuSelection) {
            setStep(5); // メニュー選択画面へ戻る
          } else {
            setStep(1); // 入力画面へ戻る
          }
        }} />
        <div className="preview-label" style={{ marginBottom: 0 }}>{watingScreenPreview.preview_label}</div>
      </div>
      <form className="preview-form" onSubmit={(e) => { e.preventDefault(); handleSubmitWaiting(); }}>
        <label className="preview-item-label">{watingScreenPreview.party_size_label}</label>
        <div className="preview-item-value">{partySize}</div>

        <label className="preview-item-label">{watingScreenPreview.contact_label}</label>
        <div className="preview-item-value">{contact}</div>

        <label className="preview-item-label">{watingScreenPreview.note_label}</label>
        <div className="preview-item-value">{notes}</div>

        {selectedMenus.length > 0 && (
          <>
            <label className="preview-item-label">{watingScreenPreview.pre_order}</label>
            <div className="preview-menu-list">
              {selectedMenus.map(menu => {
                const displayName = getTranslatedText(menu.name, menu.title_translations, selectedLanguageCode);
                return (
                  <div key={menu.menuId} className="preview-menu-item">
                    {menu.imageUrl ? (
                      <img src={menu.imageUrl} alt={displayName} className="preview-menu-image" />
                    ) : (
                      <div className="preview-menu-placeholder">No Image</div>
                    )}
                    <div className="preview-menu-info">
                      <div className="preview-menu-header">
                        <span className="preview-menu-name">{displayName}</span>
                        <span className="preview-menu-quantity">x{menu.quantity}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        <div className="preview-form-actions">
          <button type="submit" className="confirmation-btn">
            {watingScreenPreview.confirm}
          </button>
        </div>
      </form>

      {isPopupVisible && <CongestionPopup />}
    </div>
  );
}

export default WaitingScreenPreview;