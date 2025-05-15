import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import './PastReservationDetails.css';

function PastReservationDetails() {
  const { reservationId } = useParams();
  const [reservationData, setReservationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:8080/reservation-details?reservation_id=${reservationId}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch reservation details');
        }
        return response.json();
      })
      .then((data) => {
        setReservationData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching reservation details:', error);
        setError(error.message);
        setLoading(false);
      });
  }, []);

  const handleOkButtonClick = () => {
    alert('更新機能は現在開発中です。');
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="past-reservation-details-page">
      <h2 className="past-reservation-page-title">予約内容は下記の通りです</h2>

      {reservationData && (
        <>
          {/* 店情報 */}
          <section className="past-reservation-section">
            <div className="store-info-name-wrap">
              {/* <img
                src={pastReservationData.logo}
                alt={`${pastReservationData.name}`}
                className="store-info-logo"
              /> */}
              <h1 className="store-info-name">{reservationData.store_name}</h1>
            </div>
          </section>

          {/* 基本予約情報 */}
          <section className="past-reservation-section">
            <h3 className="past-reservation-section-title">基本予約情報</h3>
            <div className="past-reservation-info-list">
              <div className="past-reservation-info-item">
                <span className="past-reservation-label">予約番号:</span>
                <span className="past-reservation-value">{reservationData.reservation_id}</span>
              </div>
              <div className="past-reservation-info-item">
                <span className="past-reservation-label">予約状態:</span>
                <span className="past-reservation-value">{reservationData.reservation_status}</span>
              </div>
              <div className="past-reservation-info-item">
                <span className="past-reservation-label">予約日:</span>
                <span className="past-reservation-value">{reservationData.reservation_date}</span>
              </div>
              <div className="past-reservation-info-item">
                <span className="past-reservation-label">予約時間:</span>
                <span className="past-reservation-value">{reservationData.reservation_time}</span>
              </div>
            </div>
          </section>

          {/* ユーザー情報 */}
          <section className="past-reservation-section">
            <h3 className="past-reservation-section-title">ユーザー情報</h3>
            <div className="past-reservation-info-list">
              <div className="past-reservation-info-item">
                <span className="past-reservation-label">名前:</span>
                <span className="past-reservation-value">{reservationData.user_name}</span>
              </div>
              <div className="past-reservation-info-item">
                <span className="past-reservation-label">連絡先:</span>
                <span className="past-reservation-value">{reservationData.user_phone_number}</span>
              </div>
              <div className="past-reservation-info-item">
                <span className="past-reservation-label">メール:</span>
                <span className="past-reservation-value">{reservationData.user_email}</span>
              </div>
              <div className="past-reservation-info-item">
                <span className="past-reservation-label">人数:</span>
                <span className="past-reservation-value">{reservationData.number_of_people}</span>
              </div>
            </div>
          </section>

          {/* 予約先情報 */}
          <section className="past-reservation-section">
            <h3 className="past-reservation-section-title">予約先情報</h3>
            <div className="past-reservation-info-list">
              {/* <div className="past-reservation-info-item">
                <span className="past-reservation-label">分類:</span>
                <span className="past-reservation-value">{reservationData.category}</span>
              </div> */}
              {/* <div className="past-reservation-info-item">
                <span className="past-reservation-label">住所:</span>
                <span className="past-reservation-value">{reservationData.address}</span>
              </div> */}
              <div className="past-reservation-info-item">
                <span className="past-reservation-label">予約サービス:</span>
                <span className="past-reservation-value">{reservationData.reservation_details}</span>
              </div>
            </div>
          </section>

          {/* 決済情報 */}
          {/* <section className="past-reservation-section">
            <h3 className="past-reservation-section-title">決済情報</h3>
            <div className="past-reservation-info-list">
              <div className="past-reservation-info-item">
                <span className="past-reservation-label">価格:</span>
                <span className="past-reservation-value">￥{pastReservationData.price}</span>
              </div>
              <div className="past-reservation-info-item">
                <span className="past-reservation-label">決済状態:</span>
                <span className="past-reservation-value">{pastReservationData.paymentStatus}</span>
              </div>
              <div className="past-reservation-info-item">
                <span className="past-reservation-label">決済手段:</span>
                <span className="past-reservation-value">{pastReservationData.paymentMethod}</span>
              </div>
              <div className="past-reservation-info-item">
                <span className="past-reservation-label">取消政策:</span>
                <span className="past-reservation-value">{pastReservationData.cancellationPolicy}</span>
              </div>
            </div>
          </section> */}

          {/* 追加オプション */}
          <section className="past-reservation-section">
            <h3 className="past-reservation-section-title">追加オプション</h3>
            <div className="past-reservation-info-list">
              <div className="past-reservation-info-item">
                <span className="past-reservation-label">要請事項:</span>
                <span className="past-reservation-value">{reservationData.reservation_details}</span>
              </div>
            </div>
            <div className="past-reservation-button-group">
              <button className="ok-btn" onClick={handleOkButtonClick}>確認</button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default PastReservationDetails;