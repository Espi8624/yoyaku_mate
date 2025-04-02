import { useState } from 'react';
import ReservationModal from './ReservationModal';
import './MainPage.css';

function ProviderMainPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [selectedReservation, setSelectedReservation] = useState(null);

    // 더미 데이터 (여러 고객 포함)
    const todayReservations = [
        { id: 1, customer_name: "고객1", time_stamp: "2025-04-03T10:00:00", status: "확정" },
        { id: 2, customer_name: "고객2", time_stamp: "2025-04-03T10:00:00", status: "대기" },
        { id: 3, customer_name: "고객3", time_stamp: "2025-04-03T14:00:00", status: "대기" },
        { id: 4, customer_name: "고객4", time_stamp: "2025-04-03T16:00:00", status: "확정" },
    ];

    // 예약 상태 요약 (더미 데이터)
    const reservationStats = {
        confirmed: 5,
        pending: 2,
        canceled: 1,
    };

    // 시간대 설정 (유저가 나중에 조정 가능)
    const [startHour, setStartHour] = useState(9);
    const [endHour, setEndHour] = useState(18);

    // 동적 시간대 생성
    const generateTimeSlots = (start, end) => {
        const slots = [];
        for (let hour = start; hour <= end; hour++) {
            slots.push(`${hour}:00`);
        }
        return slots;
    };

    const timeSlots = generateTimeSlots(startHour, endHour);

    // 시간대별 예약 매핑 (여러 예약 반환)
    const getReservationsForTime = (time) => {
        return todayReservations.filter((res) => {
            const resHour = new Date(res.time_stamp).getHours();
            return resHour === parseInt(time.split(':')[0]);
        });
    };

    // 시간대 설정 변경 함수
    const handleTimeRangeChange = (newStart, newEnd) => {
        setStartHour(newStart);
        setEndHour(newEnd);
    };

    // 예약 정보 모달 열기
    const openInfoModal = (reservation) => {
        setSelectedReservation(reservation);
        setIsInfoModalOpen(true);
    };

    return (
        <div className="provider-main-page">
            <div className="dashboard">

                {/* 예약 상태 요약 */}
                <div className="dashboard-section">
                    <div className="title-container">
                        <h2 className="subtitle">予約状況</h2>
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
                        <button className="view-all-btn" onClick={() => setIsModalOpen(true)}>
                            + 新しい予約
                        </button>
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
                                                        onClick={() => openInfoModal(reservation)} // 클릭 이벤트 이동
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

                {/* 시간대 설정 예시 */}
                <div className="dashboard-section">
                    <div className="title-container">
                        <h2 className="subtitle">시간대 설정 (테스트용)</h2>
                    </div>
                    <div className="time-settings">
                        <button onClick={() => handleTimeRangeChange(8, 17)}>8:00 - 17:00</button>
                        <button onClick={() => handleTimeRangeChange(10, 20)}>10:00 - 20:00</button>
                    </div>
                </div>
            </div>

            {/* 새로운 예약 모달 */}
            {isModalOpen && <ReservationModal onClose={() => setIsModalOpen(false)} />}

            {/* 예약 정보 모달 */}
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