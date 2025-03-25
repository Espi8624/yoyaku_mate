import { useState } from 'react';
import './MainCalendar.css';

const MainCalendar = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);

    const reservations = [
        { date: "2025-03-20", details: "Central Park 예약 - 회의", id: 1 },
        { date: "2025-03-23", details: "Empire State Building 예약 - 투어", id: 2 },
        { date: "2025-03-23", details: "Times Square 예약 - 촬영", id: 3 },
        { date: "2025-03-24", details: "Brooklyn Bridge 예약 - 사진", id: 4 },
        { date: "2025-03-24", details: "Central Park 예약 - 피크닉", id: 5 },
        { date: "2025-03-25", details: "Statue of Liberty 예약 - 방문", id: 6 },
    ];

    const generateCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days = [];
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        }
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayReservations = reservations.filter(res => res.date === dateStr);
            const isReserved = dayReservations.length > 0;
            const isSelected = selectedDate === dateStr;
            days.push(
                <div
                    key={day}
                    className={`calendar-day ${isReserved ? 'reserved' : ''} ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedDate(selectedDate === dateStr ? null : dateStr)}
                >
                    {day}
                    {isReserved && (
                        <span className="reservation-marker">
                            {dayReservations.length > 1 ? dayReservations.length : ''}
                        </span>
                    )}
                </div>
            );
        }
        return days;
    };

    const selectedReservations = selectedDate ? reservations.filter(res => res.date === selectedDate) : [];

    return (
        <>
            <div className="title-container">
                <h1 className="title">カレンダー</h1>
            </div>
            <div className="calendar-header">
                <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}>
                    {"<"}
                </button>
                <span>{currentDate.toLocaleString('ja-JP', { year: 'numeric', month: 'long' })}</span>
                <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}>
                    {">"}
                </button>
            </div>
            <div className="calendar-grid">
                <div className="calendar-day header">日</div>
                <div className="calendar-day header">月</div>
                <div className="calendar-day header">火</div>
                <div className="calendar-day header">水</div>
                <div className="calendar-day header">木</div>
                <div className="calendar-day header">金</div>
                <div className="calendar-day header">土</div>
                {generateCalendar()}
            </div>
            {selectedDate && (
                <div className="reservation-list">
                    <h3>{new Date(selectedDate).toLocaleDateString('ja-JP')} 予定目録</h3>
                    {selectedReservations.length > 0 ? (
                        <ul>
                            {selectedReservations.map(res => (
                                <li key={res.id}>{res.details}</li>
                            ))}
                        </ul>
                    ) : (
                        <p>予定がありません。</p>
                    )}
                </div>
            )}
        </>
    );
};

export default MainCalendar;