import { useEffect, useState } from 'react';

import './NotificationPage.css';


function NotificationPage() {
    const [activeTab, setActiveTab] = useState('all');
    const [notifications, setNotifications] = useState([]);

    // 알림 데이터 호출
    // 탭 변경시마다 호출
    useEffect(() => {
        const fetchNotifications = async () => {
            const url = activeTab === 'all'
                ? `http://localhost:8080/notifications`
                : `http://localhost:8080/notifications?type=${activeTab}`;
            try {
                const response = await fetch(url);
                const data = await response.json();
                // 최신순 정렬렬
                setNotifications(data.sort((a, b) => b.id - a.id));
            } catch (error) {
                console.error('Error fetching notifications: ', error);
                setNotifications([]);
            }
        };
        fetchNotifications();
    }, [activeTab]);

    return (
        <div className="provider-notification-page">
            <h1>お知らせ</h1>

            {/* 탭 네비게이션션 */}
            <div className="provider-notification-tabs">
                <button
                    className={activeTab === 'all' ? 'active' : ''}
                    onClick={() => setActiveTab('all')}
                >
                    全て
                </button>
                <button
                    className={activeTab === 'store' ? 'active' : ''}
                    onClick={() => setActiveTab('store')}
                >
                    お客様から
                </button>
                <button
                    className={activeTab === 'system' ? 'active' : ''}
                    onClick={() => setActiveTab('system')}
                >
                    システムから
                </button>
            </div>

            {/* 알림 목록록 */}
            <div className="provider-notification-tab-container">
                <div className="provider-notification-tab-content">
                    <h2>
                        {activeTab === 'all' ? '全てのお知らせ' :
                            activeTab === 'store' ? 'お客様からのお知らせ' :
                                activeTab === 'system' ? 'システムからのお知らせ' : ''}
                    </h2>
                    <ul>
                        {notifications.length > 0 ? (
                            notifications.map((notification) => (
                                <li key={notification.id} className="provider-notification-item">
                                    <div className="provider-notification-info-item">
                                        <span className="provider-notification-info-value">{notification.message}</span>
                                        <span className="provider-notification-info-time">{notification.time}</span>
                                    </div>
                                </li>
                            ))
                        ) : (
                            <li className='provider-no-notifications'>お知らせがありません。</li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default NotificationPage;