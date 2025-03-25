import './UserPage.css';
import { useState } from 'react';

function UserPage() {
    const [activeTab, setActiveTab] = useState('account');
    const [isEditing, setIsEditing] = useState(false);
    const [userInfo, setUserInfo] = useState({
        name: '홍길동',
        email: 'example@email.com',
        phone: '010-1234-5678'
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUserInfo((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        setIsEditing(false);
        console.log('저장된 정보:', userInfo);
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'account':
                return (
                    <div className="tab-content">
                        <h2>アカウント情報</h2>
                        <div className="info-list">
                            <div className="info-item">
                                <span className="label">名前</span>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="name"
                                        value={userInfo.name}
                                        onChange={handleInputChange}
                                    />
                                ) : (
                                    <span className="value">{userInfo.name}</span>
                                )}
                            </div>
                            <div className="info-item">
                                <span className="label">メール</span>
                                {isEditing ? (
                                    <input
                                        type="email"
                                        name="email"
                                        value={userInfo.email}
                                        onChange={handleInputChange}
                                    />
                                ) : (
                                    <span className="value">{userInfo.email}</span>
                                )}
                            </div>
                            <div className="info-item">
                                <span className="label">電話番号</span>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="phone"
                                        value={userInfo.phone}
                                        onChange={handleInputChange}
                                    />
                                ) : (
                                    <span className="value">{userInfo.phone}</span>
                                )}
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
            case 'reservations':
                return (
                    <div className="tab-content">
                        <h2>予約状況</h2>
                        <ul>
                            <li>2025-04-01: 호텔 예약 (확정)</li>
                            <li>2025-04-15: 레스토랑 예약 (대기 중)</li>
                        </ul>
                    </div>
                );
            case 'reviews':
                return (
                    <div className="tab-content">
                        <h2>作成レヴュー</h2>
                        <ul>
                            <li>호텔 A: "정말 편안했어요!" (★★★★☆)</li>
                            <li>레스토랑 B: "음식이 맛있었어요." (★★★★★)</li>
                        </ul>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="user-page">
            <h1>マイページ</h1>
            <div className="tabs">
                <button
                    className={activeTab === 'account' ? 'active' : ''}
                    onClick={() => setActiveTab('account')}
                >
                    アカウント情報
                </button>
                <button
                    className={activeTab === 'reservations' ? 'active' : ''}
                    onClick={() => setActiveTab('reservations')}
                >
                    予約状況
                </button>
                <button
                    className={activeTab === 'reviews' ? 'active' : ''}
                    onClick={() => setActiveTab('reviews')}
                >
                    作成レヴュー
                </button>
            </div>
            <div className="tab-container">{renderTabContent()}</div>
        </div>
    );
}

export default UserPage;