import React from "react";
import "./WatingScreenInput.css";

const ja = require('../../../i18n/ja.json');
const en = require('../../../i18n/en.json');
const ko = require('../../../i18n/ko.json');

function WatingScreenInput({
    selectedLanguageCode,
    customer_name,
    setCustomerName,
    party_size,
    setPartySize,
    contact,
    setContact,
    notes,
    setNotes,
    storeId,
    onBack,
    onNext
}) {
    // 画面で使う言語データを選択
    let waitingScreenInput;
    if (selectedLanguageCode === 'ja') {
        waitingScreenInput = ja.waiting_screen_input;
    } else if (selectedLanguageCode === 'ko') {
        waitingScreenInput = ko.waiting_screen_input;
    } else {
        waitingScreenInput = en.waiting_screen_input;
    }

    const handleSubmit = e => {
        e.preventDefault();
        // 備考・電話番号が空なら「なし」をセットして次画面へ
        if (!notes || notes.trim() === "") {
            setNotes("なし");
        }
        if (!contact || contact.trim() === "") {
            setContact("なし");
        }
        onNext();
    };

    return (
        <div className="waiting-section">
            <div className="preview-label">{waitingScreenInput.input_label}</div>
            <form className="preview-form" onSubmit={handleSubmit}>
                <label htmlFor="customer_name" className="preview-item-label">{waitingScreenInput.name_label}</label>
                <div className="input-example">例: 田中太郎 / John Smith</div>
                <input
                    type="text"
                    id="customer_name"
                    name="customer_name"
                    value={customer_name}
                    onChange={e => setCustomerName(e.target.value)}
                    required
                    className="preview-item-value"
                />
                <label htmlFor="party_size" className="preview-item-label">{waitingScreenInput.party_size_label}</label>
                <div className="input-example">例: 2</div>
                <input
                    type="text"
                    id="party_size"
                    name="party_size"
                    value={party_size}
                    onChange={e => setPartySize(e.target.value)}
                    required
                    className="preview-item-value"
                />
                <label htmlFor="contact" className="preview-item-label">{waitingScreenInput.contact_label}</label>
                <div className="input-example">例: 080-1234-5678</div>
                <input
                    type="text"
                    id="contact"
                    name="contact"
                    value={contact}
                    onChange={e => setContact(e.target.value)}
                    className="preview-item-value"
                />
                <label htmlFor="notes" className="preview-item-label">{waitingScreenInput.note_label}</label>
                <div className="input-example">例: 窓際希望 / アレルギーあり</div>
                <input
                    type="text"
                    id="notes"
                    name="notes"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="preview-item-value"
                />
                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                    <button type="submit" className="confirmation-btn">{waitingScreenInput.confirm}</button>
                </div>
            </form>
        </div>
    );
}

export default WatingScreenInput;