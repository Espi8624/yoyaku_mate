import React from "react";
import { useWaitingScreen } from "../WaitingScreenContext";
import useTranslation from "../../../hook/useTranslation";
import CongestionPopup from "./CongestionPopup";
import BackButton from "../../../components/BackButton";
import { getTranslatedText } from "../../../utils/i18nHelper";
import ChatbotButton from "../../chat-bot/ChatbotButton";
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

  // Confirmation Modal State
  const [isConfirmationOpen, setIsConfirmationOpen] = React.useState(false);

  const handleInitialSubmit = () => {
    setIsConfirmationOpen(true);
  };

  const handleFinalSubmit = async () => {
    setIsConfirmationOpen(false);
    await handleSubmitWaiting();
  };

  const handleCancelConfirmation = () => {
    setIsConfirmationOpen(false);
  };

  return (
    <div className="waiting-section">
      <ChatbotButton />
      <div className="preview-header-row" style={{ display: 'flex', alignItems: 'center', marginBottom: '18px' }}>
        <BackButton onClick={() => {
          if (enableMenuSelection) {
            setStep(5); // メニュー選択画面へ戻る
          } else {
            setStep(1); // 入力画面へ戻る
          }
        }} className="header-back-button" />
        <div className="preview-label" style={{ marginBottom: 0 }}>{watingScreenPreview.preview_label}</div>
      </div>
      <form className="preview-form" onSubmit={(e) => { e.preventDefault(); handleInitialSubmit(); }}>
        <label className="confirmation-field-label">{watingScreenPreview.party_size_label}</label>
        <div className="confirmation-field-value">{partySize}</div>

        <label className="confirmation-field-label">{watingScreenPreview.contact_label}</label>
        <div className="confirmation-field-value">{contact || '-'}</div>

        <label className="confirmation-field-label">{watingScreenPreview.note_label}</label>
        <div className="confirmation-field-value">{notes || '-'}</div>

        {selectedMenus.length > 0 && (
          <>
            <label className="confirmation-field-label">{watingScreenPreview.pre_order}</label>
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

        <div className="preview-form-actions fixed-action-footer">
          <button type="submit" className="confirmation-btn">
            {watingScreenPreview.confirm}
          </button>
        </div>
      </form>

      {/* Confirmation Modal */}
      {isConfirmationOpen && (
        <div className="congestion-popup-overlay" style={{ zIndex: 3000 }}>
          <div className="congestion-popup-modal">
            <div className="congestion-popup-message" style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
              {selectedLanguageCode === 'ja' ? 'この内容で登録を進めてもよろしいですか？' : 'Is it okay to proceed with this content?'}
            </div>
            <div className="congestion-popup-actions">
              <button
                type="button"
                className="congestion-popup-close-btn"
                style={{ position: 'static', fontSize: '1rem', border: '1px solid #ccc', borderRadius: '8px', padding: '10px 20px', color: '#666', background: '#fff', transform: 'none' }}
                onClick={handleCancelConfirmation}
              >
                {selectedLanguageCode === 'ja' ? 'キャンセル' : 'Cancel'}
              </button>
              <button
                type="button"
                className="confirmation-btn"
                style={{ width: 'auto', padding: '10px 30px', margin: 0 }}
                onClick={handleFinalSubmit}
              >
                {selectedLanguageCode === 'ja' ? 'はい' : 'Yes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isPopupVisible && <CongestionPopup />}
    </div>
  );
}

export default WaitingScreenPreview;