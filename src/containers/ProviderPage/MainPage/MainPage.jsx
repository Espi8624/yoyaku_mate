import { useState } from 'react';
import ReservationModal from './ReservationModal';
import './MainPage.css';

function ProviderMainPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [selectedReservation, setSelectedReservation] = useState(null);

    // ダミーデータ
    const todayReservations = [
        { id: 1, customer_name: "고객1", time_stamp: "2025-04-03T10:00:00", status: "확정" },
        { id: 2, customer_name: "고객2", time_stamp: "2025-04-03T10:00:00", status: "대기" },
        { id: 3, customer_name: "고객3", time_stamp: "2025-04-03T14:00:00", status: "대기" },
        { id: 4, customer_name: "고객4", time_stamp: "2025-04-03T16:00:00", status: "확정" },
    ];

    // 予約状態のダミーデータ
    const reservationStats = {
        confirmed: 5,
        pending: 2,
        canceled: 1,
    };

    // 時間帯設定（今後、設定から呼出出来るように変更）
    const [startHour, setStartHour] = useState(9);
    const [endHour, setEndHour] = useState(18);

    // 動的時間帯生成
    const generateTimeSlots = (start, end) => {
        const slots = [];
        for (let hour = start; hour <= end; hour++) {
            slots.push(`${hour}:00`);
        }
        return slots;
    };

    const timeSlots = generateTimeSlots(startHour, endHour);

    // 時間帯別予約マッピング（多数の予約リターン）
    const getReservationsForTime = (time) => {
        return todayReservations.filter((res) => {
            const resHour = new Date(res.time_stamp).getHours();
            return resHour === parseInt(time.split(':')[0]);
        });
    };

    // 時間帯設定変更関数
    const handleTimeRangeChange = (newStart, newEnd) => {
        setStartHour(newStart);
        setEndHour(newEnd);
    };

    // 予約情報モーダルを開く
    const openInfoModal = (reservation) => {
        setSelectedReservation(reservation);
        setIsInfoModalOpen(true);
    };

    return (
        <div className="provider-main-page">
            <div className="dashboard">
                <div className='dashboard-section'>
                    <div className='btn-wrap'>
                        <button className="view-all-btn" onClick={() => setIsModalOpen(true)}>
                            + 新しい予約
                        </button>
                    </div>
                </div>

                {/* 예약 상태 요약 */}
                <div className="dashboard-section">
                    <div className="title-container">
                        <h2 className="subtitle">本日の予約状況</h2>
                    </div>
                    <div className="stats-wrap">
                        <div className="stats">
                            <span>確定: {reservationStats.confirmed}</span>
                            <span>待機: {reservationStats.pending}</span>
                            <span>取消: {reservationStats.canceled}</span>
                        </div>
                    </div>
                </div>

                {/* 오늘의 예약 */}
                <div className="dashboard-section">
                    <div className="title-container">
                        <h2 className="subtitle">本日の予約</h2>
                    </div>
                    <div className="graph-wrap">
                        <div className="time-graph">
                            {timeSlots.map((time, index) => {
                                const reservations = getReservationsForTime(time);
                                return (
                                    <div key={index} className="graph-slot">
                                        <div className="time-label">{time}</div>
                                        <div className="bar-container">
                                            {reservations.length > 0 ? (
                                                reservations.map((reservation) => (
                                                    <div
                                                        key={reservation.id}
                                                        className={`bar ${reservation.status === '확정' ? 'confirmed' : 'pending'}`}
                                                        onClick={() => openInfoModal(reservation)} // クリックイベントでモーダルを開く
                                                    >
                                                        <span className="bar-label">
                                                            {reservation.customer_name}
                                                        </span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="empty-bar"></div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* 時間帯設定及び変更テスト */}
                <div className="dashboard-section">
                    <div className="title-container">
                        <h2 className="subtitle">時間帯設定 (テスト)</h2>
                    </div>
                    <div className="time-settings">
                        <button onClick={() => handleTimeRangeChange(8, 17)}>8:00 - 17:00</button>
                        <button onClick={() => handleTimeRangeChange(10, 20)}>10:00 - 20:00</button>
                    </div>
                </div>
            </div>

            {/* 新しい予約作成モーダル */}
            {isModalOpen && <ReservationModal onClose={() => setIsModalOpen(false)} />}

            {/* 予約情報確認モーダル */}
            {isInfoModalOpen && selectedReservation && (
                <div className="info-modal-overlay">
                    <div className="info-modal">
                        <h3>予約情報</h3>
                        <p><strong>顧客名:</strong> {selectedReservation.customer_name}</p>
                        <p><strong>時間:</strong> {new Date(selectedReservation.time_stamp).toLocaleString('ja-JP')}</p>
                        <p><strong>状態:</strong> {selectedReservation.status}</p>
                        <div className="modal-actions">
                            <button
                                className="view-all-btn"
                                onClick={() => setIsInfoModalOpen(false)}
                            >
                                閉じる
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ProviderMainPage;