import { useEffect, useState } from 'react';

import './StorePage.css';

function StorePage() {
    const [activeTab, setActiveTab] = useState('storeAccount');
    const [isEditing, setIsEditing] = useState(false);
    const [storeInfo, setStoreInfo] = useState({
        store_name: "Test Store",
        address: "123 Tokyo St",
        phone_number: "123-456-7890",
        email: "test@example.com",
        website: "https://test.com",
        open_time: "09:00",
        close_time: "18:00"
    });
    const [reservations, setReservations] = useState({});
    const [reviews, setReviews] = useState({});

    useEffect(() => {
        // 초기 데이터 설정 (테스트용)
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setStoreInfo((prev) => ({ ...prev || {}, [name]: value }));
    };

    const handleTimeChange = (key, value) => {
        setStoreInfo((prev) => ({
            ...prev,
            [key]: value || ""
        }));
    };

    const handleSave = () => {
        setIsEditing(false);
        console.log('저장된 정보:', storeInfo);
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'storeAccount':
                return (
                    <div className="tab-content">
                        <h2>店舗情報</h2>
                        <div className="info-list">
                            <div className="info-item">
                                <span className="label">店舗名</span>
                                <input
                                    type="text"
                                    name="store_name"
                                    value={storeInfo.store_name || ""}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className={!isEditing ? "read-only" : ""}
                                />
                            </div>
                            <div className="info-item">
                                <span className="label">住所</span>
                                <input
                                    type="text"
                                    name="address"
                                    value={storeInfo.address || ""}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className={!isEditing ? "read-only" : ""}
                                />
                            </div>
                            <div className="info-item">
                                <span className="label">電話番号</span>
                                <input
                                    type="text"
                                    name="phone_number"
                                    value={storeInfo.phone_number || ""}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className={!isEditing ? "read-only" : ""}
                                />
                            </div>
                            <div className="info-item">
                                <span className="label">メール</span>
                                <input
                                    type="email"
                                    name="email"
                                    value={storeInfo.email || ""}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className={!isEditing ? "read-only" : ""}
                                />
                            </div>
                            <div className="info-item">
                                <span className="label">公式サイト</span>
                                <input
                                    type="text"
                                    name="website"
                                    value={storeInfo.website || ""}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className={!isEditing ? "read-only" : ""}
                                />
                            </div>
                        </div>
                        <hr className="divider" />
                        <div className="info-item time-section">
                            <span className="label">営業時間</span>
                            <div className="time-wrapper">
                                <input
                                    type="time"
                                    name="open_time"
                                    value={storeInfo.open_time || "00:00"}
                                    onChange={(e) => handleTimeChange('open_time', e.target.value)}
                                    disabled={!isEditing}
                                    className={!isEditing ? "read-only" : ""}
                                    step="300"
                                />
                                <span className="time-separator"> ~ </span>
                                <input
                                    type="time"
                                    name="close_time"
                                    value={storeInfo.close_time || "00:00"}
                                    onChange={(e) => handleTimeChange('close_time', e.target.value)}
                                    disabled={!isEditing}
                                    className={!isEditing ? "read-only" : ""}
                                    step="300"
                                />
                            </div>
                        </div>
                        <div className="button-group">
                            {isEditing ? (
                                <>
                                    <button className="save-btn" onClick={handleSave}>
                                        保存
                                    </button>
                                    <button
                                        className="cancel-btn"
                                        onClick={() => setIsEditing(false)}
                                    >
                                        取消
                                    </button>
                                </>
                            ) : (
                                <button
                                    className="edit-btn"
                                    onClick={() => setIsEditing(true)}
                                >
                                    修正
                                </button>
                            )}
                        </div>
                    </div>
                );
                case 'storeMenu':
                    return (
                        <div className="tab-content">
                            <h2>店舗メニュー</h2>
                            <ul>
                                {storeInfo.menu && storeInfo.menu.length > 0 ? (
                                    storeInfo.menu.map((item, index) => (
                                        <li key={index}>
                                            {item.name} - {item.price}
                                        </li>
                                    ))
                                ) : (
                                    <p>メニューがありません。</p>
                                )}
                            </ul>
                        </div>
                    );
                case 'reservations':
                    return (
                        <div className="tab-content">
                            <h2>予約状況</h2>
                            <ul>
                                {reservations.length > 0 ? (
                                    <ul>
                                        {reservations.map(res => (
                                            <li key={res.id}>{res.time_stamp} : {res.details}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p>予定がありません。</p>
                                )}
                            </ul>
                        </div>
                    );
                case 'reviews':
                    return (
                        <div className="tab-content">
                            <h2>レヴュー</h2>
                            {reviews.length > 0 ? (
                                <ul>
                                    {reviews.map(res => (
                                        <li key={res.id}>{res.time_stamp} / {res.store_name} / {res.comments} / {res.rating}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p>予定がありません。</p>
                            )}
                        </div>
                    );
                default:
                    return null;
            }
    };

    return (
        <div className="store-page">
            <h1>店舗ページ</h1>
            <div className="tabs">
                <button className={activeTab === 'storeAccount' ? 'active' : ''} onClick={() => setActiveTab('storeAccount')}>
                    店舗情報
                </button>
                <button className={activeTab === 'storeMenu' ? 'active' : ''} onClick={() => setActiveTab('storeMenu')}>
                    店舗メニュー
                </button>
                <button className={activeTab === 'reservations' ? 'active' : ''} onClick={() => setActiveTab('reservations')}>
                    予約状況
                </button>
                <button className={activeTab === 'reviews' ? 'active' : ''} onClick={() => setActiveTab('reviews')}>
                    レヴュー
                </button>
            </div>
            <div className="tab-container">{renderTabContent()}</div>
        </div>
    );
}

export default StorePage;