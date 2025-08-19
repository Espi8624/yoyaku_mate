import React, { useState, useEffect } from "react";
import "./WatingScreen.css";

const ja = require('../../../i18n/ja.json');
const en = require('../../../i18n/en.json');
const ko = require('../../../i18n/ko.json');

function WatingScreen({
    selectedNationality,
    selectedLanguageCode: initialLanguageCode,
    customer_name: initialCustomerName,
    party_size: initialPartySize,
    notes: initialNotes,
    waitingId,
    onBack
}) {
    const [menuList, setMenuList] = useState([]);
    const [showCategories, setShowCategories] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    // DBから取得した値
    const [queueNumber, setQueueNumber] = useState("");
    const [customerName, setCustomerName] = useState(initialCustomerName);
    const [partySize, setPartySize] = useState(initialPartySize);
    const [notes, setNotes] = useState(initialNotes);
    const [languageCode, setLanguageCode] = useState(initialLanguageCode);
    const [waitingCount, setWaitingCount] = useState(0);
    const [estimated_Waiting_Time, setEstimatedWaitingTime] = useState("-");
    // キャンセルポップアップ
    const [showCancelPopup, setShowCancelPopup] = useState(false);

    let waitingScreen;
    if (languageCode === 'ja') {
        waitingScreen = ja.waiting_screen;
    } else if (languageCode === 'ko') {
        waitingScreen = ko.waiting_screen;
    } else {
        waitingScreen = en.waiting_screen;
    }

    // カテゴリーリストを生成
    const categories = Array.isArray(menuList) ? Array.from(new Set(menuList.map(item => item.category))) : [];
    // 2カラム表示用に分割
    const splitCategories = () => {
        const mid = Math.ceil(categories.length / 2);
        return [categories.slice(0, mid), categories.slice(mid)];
    };

    useEffect(() => {
        fetch('http://localhost:8080/api/menu-list?store_id=store-001')
            .then((res) => {
                if (!res.ok) throw new Error('Failed to fetch menu_list');
                return res.json();
            })
            .then((data) => {
                if (Array.isArray(data.data)) {
                    setMenuList(data.data);
                    console.log('Fetched menuList:', data.data);
                } else {
                    setMenuList([]);
                    console.error('menuList is not an array:', data);
                }
            })
            .catch((err) => {
                setMenuList([]);
                console.error('Error fetching menu_list:', err);
            });
    }, []);

    useEffect(() => {
        if (!waitingId) return;
        fetch(`http://localhost:8080/api/waiting-list?store_id=store-001&waiting_id=${waitingId}`)
            .then(res => res.json())
            .then(item => {
                console.log('waiting-list fetch result:', item);
                // item.dataが配列ならdata[0]、なければitem自身
                const data = Array.isArray(item.data) ? item.data[0] : (item.data || item);
                if (data) {
                    setLanguageCode(data.selectedLanguageCode || data.language_code || initialLanguageCode);
                    setQueueNumber(data.queue_number || "");
                    setCustomerName(data.customer_name || "");
                    setPartySize(data.party_size || "");
                    setNotes(data.notes || "");
                }
            });
    }, [waitingId]);

    useEffect(() => {
        // store_idとstatus==waitingの件数を取得
        fetch('http://localhost:8080/api/waiting-list?store_id=store-001')
            .then(res => res.json())
            .then(result => {
                const arr = Array.isArray(result.data) ? result.data : [];
                const count = arr.filter(item => item.status === 'waiting').length;
                setWaitingCount(count);
                console.log('waiting-list 全データ:', result);
            });
    }, []);

    useEffect(() => {
        // 平均待機時間を取得
        fetch('http://localhost:8080/api/waiting-list?action=average_waiting_time&store_id=store-001')
            .then(res => res.json())
            .then(result => {
                setEstimatedWaitingTime(result.average_text || "-");
            });
    }, []);

    React.useEffect(() => {
        console.log('Current menuList state:', menuList);
    }, [menuList]);

    return (
        <div className="waiting-section">
            <div className="preview-label">{waitingScreen.label_1 && waitingScreen.label_1.replace("{{name}}", customerName)}</div>
            {waitingScreen.label_2 && (
                <div className="waiting-label-2">{waitingScreen.label_2}</div>
            )}
            <form className="preview-form">
                <label className="preview-item-label">{waitingScreen.waiting_number_label}</label>
                <div className="preview-item-value">{queueNumber}</div>
                <label className="preview-item-label">{waitingScreen.name_label}</label>
                <div className="preview-item-value">{customerName}</div>
                <label className="preview-item-label">{waitingScreen.party_size_label}</label>
                <div className="preview-item-value">{partySize}</div>
                <label className="preview-item-label">{waitingScreen.note_label}</label>
                <div className="preview-item-value">{notes}</div>
                <label className="preview-item-label">{waitingScreen.current_waiting_label}</label>
                <div className="preview-item-value">{waitingCount}{waitingScreen.group_label}</div>
                <label className="preview-item-label">{waitingScreen.estimated_wait_time_label}</label>
                <div className="preview-item-value">{estimated_Waiting_Time}</div>
            </form>
            {waitingScreen.menu_label && (
                <div className="menu-label">
                    {waitingScreen.menu_label}
                </div>
            )}
            <button className="confirmation-btn" onClick={() => setShowCategories(!showCategories)}>
                {showCategories ? "メニューを閉じる" : waitingScreen.menu_overview_label}
            </button>
            {showCategories && !selectedCategory && (
                <div className="menu-list-2col">
                    {splitCategories().map((col, colIdx) => (
                        <div key={colIdx} className="menu-category-col">
                            {col.map((cat, idx) => (
                                <div className="menu-category-item" key={idx} onClick={() => setSelectedCategory(cat)} style={{ cursor: 'pointer' }}>{cat}</div>
                            ))}
                        </div>
                    ))}
                </div>
            )}
            {showCategories && selectedCategory && (
                <>
                    <h2>{selectedCategory} のメニュー</h2>
                    <div className="menu-list-2col">
                        {menuList.filter(item => item.category === selectedCategory).map((item, idx) => (
                            <div className="menu-item" key={idx}>
                                <span>{item.title}</span>
                                <span>{item.price}円</span>
                            </div>
                        ))}
                    </div>
                    <button className="confirmation-btn" onClick={() => setSelectedCategory(null)} style={{ marginBottom: '16px' }}>戻る</button>
                </>
            )}
            <button className="confirmation-btn cancel-btn" onClick={() => setShowCancelPopup(true)}>
                予約をキャンセル
            </button>
            {showCancelPopup && (
                <div className="congestion-popup-overlay">
                    <div className="congestion-popup-modal cancel-modal">
                        <button
                            className="congestion-close-btn"
                            onClick={() => setShowCancelPopup(false)}
                        >×</button>
                        <div className="congestion-popup-message">
                            予約をキャンセルいたします
                        </div>
                        <div className="congestion-popup-actions cancel-actions">
                            <button
                                className="confirmation-btn cancel-yes-btn"
                                onClick={async () => {
                                    try {
                                        await fetch(`http://localhost:8080/api/waiting-list?action=status`, {
                                            method: 'PATCH',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                store_id: 'store-001',
                                                waiting_id: waitingId,
                                                status: 'cancelled'
                                            })
                                        });
                                    } catch (err) { }
                                    setShowCancelPopup(false);
                                    onBack && onBack({ step: 1 });
                                }}
                            >はい</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default WatingScreen;