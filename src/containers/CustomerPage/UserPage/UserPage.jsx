import './UserPage.css';
import { useEffect, useState } from 'react';

function UserPage() {
    const [activeTab, setActiveTab] = useState('account');
    const [isEditing, setIsEditing] = useState(false);
    const [userInfo, setUserInfo] = useState({});
    const [reservations, setReservations] = useState([]);
    const [reviews, setReviews] = useState([]);

    useEffect(() => {
        // ユーザーデータ呼出
        fetch('http://localhost:8080/user-info')
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Failed to fetch user data');
                }
                return response.json();
            })
            .then((data) => setUserInfo(data))
            .catch((error) => console.error('Error fetching user info data: ', error));

        // 予約データ呼出
        fetch('http://localhost:8080/reservations')
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Failed to fetch timeline data');
                }
                return response.json();
            })
            .then((data) => setReservations(data))
            .catch((error) => console.error('Error fetching reservations data: ', error));

        // レヴューデータ呼出
        fetch('http://localhost:8080/reviews')
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Failed to fetch timeline data');
                }
                return response.json();
            })
            .then((data) => setReviews(data))
            .catch((error) => console.error('Error fetching reservations data: ', error));
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUserInfo((prev) => ({ ...prev || {}, [name]: value }));
    };

    const handleSave = () => {
        setIsEditing(false);
        console.log('保存される情報:', userInfo);
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
                                <input
                                    type="text"
                                    name="user_name"
                                    value={userInfo.user_name || ""}
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
                                    value={userInfo.email || ""}
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
                                    value={userInfo.phone_number || ""}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className={!isEditing ? "read-only" : ""}
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
            case 'reservations':
                return (
                    <div className="tab-content">
                        <h2>予約状況</h2>
                        <ul>
                            {reservations.length > 0 ? (
                                reservations.map(res => (
                                    <li key={res.id}>{res.time_stamp} : {res.details}</li>
                                ))
                            ) : (
                                <p>予定がありません。</p>
                            )}
                        </ul>
                    </div>
                );
            case 'reviews':
                return (
                    <div className="tab-content">
                        <h2>作成レヴュー</h2>
                        {reviews.length > 0 ? (
                            reviews.map(res => (
                                <li key={res.id}>{res.time_stamp} / {res.store_name} / {res.comments} / {res.rating}</li>
                            ))
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