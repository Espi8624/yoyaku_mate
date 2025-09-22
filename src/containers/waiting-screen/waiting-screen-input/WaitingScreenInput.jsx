import React from "react";

import { useWaitingScreen } from "../WaitingScreenContext";
import FormField from "./FormField"; 
import "./WaitingScreenInput.css";
import useTranslation from "../../../hook/useTranslation";

function WaitingScreenInput() {
  // Contextから必要なものを持ってくる
  const {
    partySize, setPartySize,
    contact, setContact,
    notes, setNotes,
    goToNextStep,
    selectedLanguageCode,
  } = useWaitingScreen();

  // 多国語処理
  const t = useTranslation(selectedLanguageCode);
  const waitingScreenInput = t.waiting_screen_input;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!notes || notes.trim() === "") {
      setNotes("なし");
    }
    if (!contact || contact.trim() === "") {
      setContact("なし");
    }
    goToNextStep();
  };

  return (
    <div className="waiting-section">
      <div className="preview-label">{waitingScreenInput.input_label}</div>
      <form className="preview-form" onSubmit={handleSubmit}>
        
        <FormField
          id="party_size"
          label={waitingScreenInput.party_size_label}
          example="例: 2"
          value={partySize}
          onChange={(e) => setPartySize(e.target.value)}
          type="number" 
          required
        />
        
        <FormField
          id="contact"
          label={waitingScreenInput.contact_label}
          example="例: 080-1234-5678"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          type="tel" 
        />

        <FormField
          id="notes"
          label={waitingScreenInput.note_label}
          example="例: 窓際希望 / アレルギーあり"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="waiting-form-actions">
          <button type="submit" className="confirmation-btn">
            {waitingScreenInput.confirm}
          </button>
        </div>
      </form>
    </div>
  );
}

export default WaitingScreenInput;