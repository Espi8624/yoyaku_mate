import React from "react";
import "./WatingScreenPreview.css";

const ja = require('../../../i18n/ja.json');
const en = require('../../../i18n/en.json');
const ko = require('../../../i18n/ko.json');

function WatingScreenPreview({
    selectedNationality,
    selectedLanguageCode,
    customer_name,
    party_size,
    contact,
    notes,
    onBack,
    onNext,
    setWaitingId // 追加
}) {
    let watingScreenPreview;
    if (selectedLanguageCode === 'ja') {
        watingScreenPreview = ja.waiting_screen_preview;
    } else if (selectedLanguageCode === 'ko') {
        watingScreenPreview = ko.waiting_screen_preview;
    } else {
        watingScreenPreview = en.waiting_screen_preview;
    }

    // ユニークなwaiting_id生成（日時+ランダム）
    // ロジック部分
    const generateWaitingId = () => {
        const now = new Date();
        return (
            now.getFullYear().toString() +
            ("0" + (now.getMonth() + 1)).slice(-2) +
            ("0" + now.getDate()).slice(-2) + "-" +
            ("0" + now.getHours()).slice(-2) +
            ("0" + now.getMinutes()).slice(-2) +
            ("0" + now.getSeconds()).slice(-2) +
            '-' + Math.random().toString(36).substring(2, 8)
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const waiting_id = generateWaitingId();
        setWaitingId && setWaitingId(waiting_id); // 追加
        const store_id = "store-001"; // 必要に応じて動的に
        const payload = {
            store_id,
            waiting_id,
            customer_name,
            party_size: Number(party_size),
            nationality: selectedNationality,
            contact,
            notes,
            status: "waiting"
        };
        console.log("[waiting-list 登録内容]", payload);
        try {
            const res = await fetch("http://localhost:8080/api/waiting-list", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                alert("登録が完了しました");
                onNext && onNext();
            } else {
                const err = await res.text();
                alert("登録に失敗しました: " + err);
            }
        } catch (err) {
            alert("通信エラー: " + err);
        }
    };

    return (
        <div className="waiting-section">
            <div className="preview-label">{watingScreenPreview.preview_label}</div>
            <form className="preview-form" onSubmit={handleSubmit}>
                <label className="preview-item-label">{watingScreenPreview.name_label}</label>
                <div className="preview-item-value">{customer_name}</div>
                <label className="preview-item-label">{watingScreenPreview.party_size_label}</label>
                <div className="preview-item-value">{party_size}</div>
                <label className="preview-item-label">{watingScreenPreview.contact_label}</label>
                <div className="preview-item-value">{contact}</div>
                <label className="preview-item-label">{watingScreenPreview.note_label}</label>
                <div className="preview-item-value">{notes}</div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                    <button type="button" className="confirmation-btn" onClick={onBack}>{watingScreenPreview.back}</button>
                    <button type="submit" className="confirmation-btn">{watingScreenPreview.confirm}</button>
                </div>
            </form>
        </div>
    );
}

export default WatingScreenPreview;