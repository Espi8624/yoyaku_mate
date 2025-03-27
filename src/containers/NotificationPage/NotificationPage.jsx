import { useState } from 'react';

import './NotificationPage.css';


function NotificationPage() {
    const [activeTab, setActiveTab] = useState('all');

    const notifications = {
        store: [
            { id: 1, message: '가게 A에서 새 메뉴가 추가되었습니다.', time: '2시간 전', type: 'store' },
            { id: 2, message: '가게 B 주문이 준비되었습니다.', time: '4시간 전', type: 'store' }
        ],
        coupon: [
            { id: 3, message: '50% 할인 쿠폰이 발급되었습니다.', time: '1일 전', type: 'coupon' },
            { id: 4, message: '주말 특가 쿠폰이 도착했습니다.', time: '2일 전', type: 'coupon' }
        ],
        system: [
            { id: 5, message: '시스템 점검이 3월 28일 예정입니다.', time: '3시간 전', type: 'system' },
            { id: 6, message: '앱이 업데이트되었습니다.', time: '5시간 전', type: 'system' }
        ]
    };

    const allNotifications = [
        ...notifications.store,
        ...notifications.coupon,
        ...notifications.system,
    ].sort((a, b) => b.id - a.id);

    // 표시할 알림
    const getCurrentNotifications = () => {
        switch (activeTab) {
            case 'all':
                return allNotifications;
            case 'store':
                return notifications.store;
            case 'coupon':
                return notifications.coupon;
            case 'system':
                return notifications.system;
            default:
                return [];
        }
    };

    return (
        <div className="notification-page">
            <h1>お知らせ</h1>

            {/* 탭 네비게이션션 */}
            <div className="tabs">
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
                    店から
                </button>
                <button
                    className={activeTab === 'coupon' ? 'active' : ''}
                    onClick={() => setActiveTab('coupon')}
                >
                    クーポン
                </button>
                <button
                    className={activeTab === 'system' ? 'active' : ''}
                    onClick={() => setActiveTab('system')}
                >
                    システムから
                </button>
            </div>

            {/* 알림 목록록 */}
            <div className="tab-container">
                <div className="tab-content">
                    <h2>
                        {activeTab === 'all' ? '全てのお知らせ' :
                            activeTab === 'store' ? '店からのお知らせ' :
                                activeTab === 'coupon' ? 'クーポンのお知らせ' : 'システムからのお知らせ'}
                    </h2>
                    <ul>
                        {getCurrentNotifications().map((notification) => (
                            <li key={notification.id} className="notification-item">
                                <div className="info-item">
                                    <span className="value">{notification.message}</span>
                                    <span className="time">{notification.time}</span>
                                </div>
                            </li>
                        ))}
                        {getCurrentNotifications().length === 0 && (
                            <li className="no-notifications">새로운 알림이 없습니다.</li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default NotificationPage;