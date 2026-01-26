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
    enableMenuSelection,
    setStep,
    selectedLanguageCode,
    isOffline,
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

    if (enableMenuSelection) {
      setStep(5); // メニュー選択画面へ遷移
    } else {
      setStep(2); // 確認画面へ遷移
    }
  };

  // 全角から半角に変換する関数を追加
  const convertFullWidthToHalfWidth = (str) => {
    return str.replace(/[０-９]/g, function (s) {
      return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    });
  };

  return (
    <div className="waiting-section">
      <div className="preview-label">{waitingScreenInput.input_label}</div>
      <form className="preview-form" onSubmit={handleSubmit}>

        <FormField
          id="party_size"
          label={waitingScreenInput.party_size_label}
          example={waitingScreenInput.party_size_placeholder}
          value={partySize}
          onChange={(e) => setPartySize(convertFullWidthToHalfWidth(e.target.value))}
          type="number"
          required
        />

        <FormField
          id="contact"
          label={waitingScreenInput.contact_label}
          example={waitingScreenInput.contact_placeholder}
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          type="tel"
        />

        <FormField
          id="notes"
          label={waitingScreenInput.note_label}
          example={waitingScreenInput.note_placeholder}
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