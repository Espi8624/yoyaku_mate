import { useState } from 'react';
import './ReservationModal.css';

function ReservationModal({ onClose }) {
    const [formData, setFormData] = useState({
        customerName: '',
        reservationTime: '',
        notes: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // 예약 데이터 전송
        fetch('http://localhost:8080/provider/reservations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        })
            .then((response) => response.json())
            .then(() => {
                onClose(); // 모달 닫기
            })
            .catch((error) => console.error('Error submitting reservation:', error));
    };

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
                        予約時間:
                        <input
                            type="datetime-local"
                            name="reservationTime"
                            value={formData.reservationTime}
                            onChange={handleChange}
                            required
                        />
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
