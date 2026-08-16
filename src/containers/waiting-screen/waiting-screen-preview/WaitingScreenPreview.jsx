import React from "react";
import { useWaitingScreen } from "../WaitingScreenContext";
import useTranslation from "../../../hook/useTranslation";
import CongestionPopup from "./CongestionPopup";
import BackButton from "../../../components/BackButton";
import { getTranslatedText } from "../../../utils/i18nHelper";
import ChatbotButton from "../../chat-bot/ChatbotButton";
import styles from "./WaitingScreenPreview.module.css";

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
    <div className="page-container">
      <div className="page-top-bar">
        <div className="page-top-bar-left">
          <BackButton onClick={() => {
            if (enableMenuSelection) {
              setStep(5); // メニュー選択画面へ戻る
            } else {
              setStep(1); // 入力画面へ戻る
            }
          }} />
        </div>
        <div className="page-top-bar-right">
          <ChatbotButton />
        </div>
      </div>
      <h1 className="page-title">{watingScreenPreview.preview_label}</h1>
      <form className={styles["preview-form"]} onSubmit={(e) => { e.preventDefault(); handleInitialSubmit(); }}>
        <label className={styles["confirmation-field-label"]}>{watingScreenPreview.party_size_label}</label>
        <div className={styles["confirmation-field-value"]}>{partySize}</div>

        <label className={styles["confirmation-field-label"]}>{watingScreenPreview.contact_label}</label>
        <div className={styles["confirmation-field-value"]}>{contact || '-'}</div>

        <label className={styles["confirmation-field-label"]}>{watingScreenPreview.note_label}</label>
        <div className={styles["confirmation-field-value"]}>{notes || '-'}</div>

        {selectedMenus.length > 0 && (
          <>
            <label className={styles["confirmation-field-label"]}>{watingScreenPreview.pre_order}</label>
            <div className={styles["preview-menu-list"]}>
              {selectedMenus.map(menu => {
                const displayName = getTranslatedText(menu.name, menu.title_translations, selectedLanguageCode);
                return (
                  <div key={menu.menuId} className={styles["preview-menu-item"]}>
                    {menu.imageUrl ? (
                      <img src={menu.imageUrl} alt={displayName} className={styles["preview-menu-image"]} />
                    ) : (
                      <div className={styles["preview-menu-placeholder"]}>No Image</div>
                    )}
                    <div className={styles["preview-menu-info"]}>
                      <div className={styles["preview-menu-header"]}>
                        <span className={styles["preview-menu-name"]}>{displayName}</span>
                        <span className={styles["preview-menu-quantity"]}>x{menu.quantity}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        <div className="fixed-footer">
          <div className="fixed-footer-inner">
            <button type="submit" className="btn-primary">
            {watingScreenPreview.confirm}
            </button>
          </div>
        </div>
      </form>

      {/* Confirmation Modal */}
      {isConfirmationOpen && (
        <div className="popup-overlay" style={{ zIndex: 3000 }}>
          <div className="popup-modal">
            <p className="popup-message" style={{ fontWeight: 'bold' }}>
              {watingScreenPreview.submit_confirm?.message}
            </p>
            <div className="popup-actions">
              <button
                type="button"
                className="btn-secondary"
                style={{ width: 'auto', padding: '10px 24px' }}
                onClick={handleCancelConfirmation}
              >
                {watingScreenPreview.submit_confirm?.cancel}
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ width: 'auto', padding: '10px 30px' }}
                onClick={handleFinalSubmit}
              >
                {watingScreenPreview.submit_confirm?.confirm}
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