import React, { useState } from "react";
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
    storeId,
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

    const [showCongestionPopup, setShowCongestionPopup] = useState(false);
    const [pendingPayload, setPendingPayload] = useState(null);
    const [popupMessage, setPopupMessage] = useState("");
    const [popupMode, setPopupMode] = useState("congestion"); // "congestion" or "max"

    const handleSubmit = async (e) => {
        e.preventDefault();
        const store_id = storeId || "";
        console.log('[store_idデバッグ]', store_id);
        // 1. 現在の待機人数取得
        let waitingCount = 0;
        let estimatedWaitingCount = null;
        let maxWaitingCount = null;
        try {
            // 待機人数
            const res1 = await fetch(`http://localhost:8080/api/waiting-list?store_id=${store_id}`);
            const data1 = await res1.json();
            const arr = Array.isArray(data1.data) ? data1.data : [];
            // 待機中グループのparty_size合計
            const waitingPartySum = arr
                .filter(item => item.status === 'waiting')
                .reduce((sum, item) => sum + (Number(item.party_size) || 0), 0);
            // 登録中ユーザーのparty_sizeを加算
            waitingCount = waitingPartySum + Number(party_size);
            // 店舗設定（estimated_waiting_count, max_waiting_count取得）
            const res2 = await fetch(`http://localhost:8080/api/store_settings?store_id=${store_id}`);
            const data2 = await res2.json();
            estimatedWaitingCount =
                data2?.settings?.waiting_policy?.estimated_waiting_count ??
                data2?.data?.settings?.waiting_policy?.estimated_waiting_count ??
                null;
            maxWaitingCount =
                data2?.settings?.waiting_policy?.max_waiting_count ??
                data2?.data?.settings?.waiting_policy?.max_waiting_count ??
                null;
            // ログ表示
            console.log(`待機人数: ${waitingCount}, 想定待機人数: ${estimatedWaitingCount}, 最大待機人数: ${maxWaitingCount}`);
        } catch (err) {
            // 取得失敗時は何もしない
        }
        // 2. 判定
        const waiting_id = generateWaitingId();
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
        setWaitingId && setWaitingId(waiting_id); // 追加
        // party_sizeが最大待機人数を超えている場合
        if (maxWaitingCount !== null && Number(party_size) > Number(maxWaitingCount)) {
            setPopupMessage("大変申し訳ございません。\n当店の最大収容人数を超えているため、予約できません。");
            setPopupMode("max");
            setShowCongestionPopup(true);
            return;
        }
        // 通常の混雑判定
        if (
            estimatedWaitingCount !== null &&
            waitingCount >= Number(estimatedWaitingCount)
        ) {
            setPendingPayload(payload);
            setPopupMessage("現在大変混雑しており、ご案内までにお時間をいただく可能性がございます。\n予めご了承お願いします。");
            setPopupMode("congestion");
            setShowCongestionPopup(true);
            return;
        }
        await submitWaiting(payload);
    };

    const submitWaiting = async (payload) => {
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
                <div className="preview-form-actions">
                    <button type="button" className="confirmation-btn" onClick={onBack}>{watingScreenPreview.back}</button>
                    <button type="submit" className="confirmation-btn">{watingScreenPreview.confirm}</button>
                </div>
            </form>
            {showCongestionPopup && (
                <div className="congestion-popup-overlay">
                    <div className="congestion-popup-modal">
                        <button
                            className="congestion-popup-close-btn"
                            onClick={() => {
                                setShowCongestionPopup(false);
                                setPendingPayload(null);
                            }}
                            aria-label="閉じる"
                        >×</button>
                        <div className="congestion-popup-message">
                            {popupMessage}
                        </div>
                        <div className="congestion-popup-actions">
                            <button
                                className="confirmation-btn"
                                onClick={async () => {
                                    setShowCongestionPopup(false);
                                    if (popupMode === "max") {
                                        // Step2へ遷移（入力情報を保持して渡す）
                                        onNext && onNext({
                                            customer_name,
                                            party_size,
                                            contact,
                                            notes,
                                            selectedNationality,
                                            selectedLanguageCode
                                        });
                                        setPendingPayload(null);
                                    } else if (popupMode === "congestion") {
                                        if (pendingPayload) {
                                            await submitWaiting(pendingPayload);
                                            setPendingPayload(null);
                                        }
                                    }
                                }}
                            >確認</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default WatingScreenPreview;