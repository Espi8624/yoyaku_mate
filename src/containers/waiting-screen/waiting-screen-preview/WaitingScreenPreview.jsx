import React from "react";
import { useWaitingScreen } from "../WaitingScreenContext";
import useTranslation from "../../../hook/useTranslation";
import CongestionPopup from "./CongestionPopup"; 
import "./WaitingScreenPreview.css";

function WaitingScreenPreview() {
  const {
    partySize,
    contact,
    notes,
    selectedLanguageCode,
    goToPrevStep,
    handleSubmitWaiting,
    isPopupVisible,
  } = useWaitingScreen();

  const t = useTranslation(selectedLanguageCode);
  const watingScreenPreview = t.waiting_screen_preview;

  return (
    <div className="waiting-section">
      <div className="preview-label">{watingScreenPreview.preview_label}</div>
      <form className="preview-form" onSubmit={(e) => { e.preventDefault(); handleSubmitWaiting(); }}>
        <label className="preview-item-label">{watingScreenPreview.party_size_label}</label>
        <div className="preview-item-value">{partySize}</div>
        
        <label className="preview-item-label">{watingScreenPreview.contact_label}</label>
        <div className="preview-item-value">{contact}</div>
        
        <label className="preview-item-label">{watingScreenPreview.note_label}</label>
        <div className="preview-item-value">{notes}</div>
        
        <div className="preview-form-actions">
          <button type="button" className="confirmation-btn" onClick={goToPrevStep}>
            {watingScreenPreview.back}
          </button>
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