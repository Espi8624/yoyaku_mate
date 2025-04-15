import { useState } from 'react';
import './ReservationModal.css';

function ReservationModal({ onClose }) {
    const [formData, setFormData] = useState({
        customerName: '',
        reservationDate: '',
        reservationTime: '',
        notes: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // 日付と時間を結合し、バックエンドへ送信
        const reservationTime = `${formData.reservationDate}T${formData.reservationTime}`;
        const dataToSend = { ...formData, reservationTime };
        fetch('http://localhost:8080/provider/reservations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend),
        })
            .then((response) => response.json())
            .then(() => {
                onClose();
            })
            .catch((error) => console.error('Error submitting reservation:', error));
    };

    // 5分単位時間オプション生成 (00:00 ~ 23:55)
    const timeOptions = Array.from({ length: 24 * 12 }, (_, i) => {
        const hours = String(Math.floor(i / 12)).padStart(2, '0');
        const minutes = String((i % 12) * 5).padStart(2, '0');
        return `${hours}:${minutes}`;
    });

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>新しい予約</h2>
                <form onSubmit={handleSubmit}>
                    <label>
                        お客様の名前:
                        <input
                            type="text"
                            name="customerName"
                            value={formData.customerName}
                            onChange={handleChange}
                            required
                        />
                    </label>
                    <label>
                        予約日付:
                        <input
                            type="date"
                            name="reservationDate"
                            value={formData.reservationDate}
                            onChange={handleChange}
                            required
                        />
                    </label>
                    <label>
                        予約時間:
                        <select
                            name="reservationTime"
                            value={formData.reservationTime}
                            onChange={handleChange}
                            required
                        >
                            <option value="">時間を選択</option>
                            {timeOptions.map((time) => (
                                <option key={time} value={time}>
                                    {time}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label>
                        メモ:
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                        />
                    </label>
                    <div className="modal-actions">
                        <button type="button" onClick={onClose}>キャンセル</button>
                        <button type="submit">予約する</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ReservationModal;