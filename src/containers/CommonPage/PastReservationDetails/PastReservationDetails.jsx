import './PastReservationDetails.css';

function PastReservationDetails() {

  // ダミーデータ
  const pastReservationData = {
    reservationId: 123456,
    status: '確定',
    logo: 'https://via.placeholder.com/60',
    name: '川崎食堂',
    date: '2025-04-22',
    time: '18:00',
    customerName: '山田 太郎',
    contact: '090-1234-5678',
    numberOfPeople: 4,
    category: 'レストラン',
    address: '東京都新宿区1-2-3',
    service: 'ディナーコース',
    price: 10000,
    paymentStatus: '支払い済み',
    paymentMethod: 'クレジットカード',
    cancellationPolicy: '当日取消不可',
    specialRequests: '窓際の席を希望'
  };

  const handleOkButtonClick = () => {
    alert('更新機能は現在開発中です。');
  };

  return (
    <div className="past-reservation-details-page">
      <h2 className="past-reservation-page-title">予約内容は下記の通りです</h2>

      {/* 店情報 */}
      <section className="past-reservation-section">
        <div className="store-info-name-wrap">
          <img
            src={pastReservationData.logo}
            alt={`${pastReservationData.name}`}
            className="store-info-logo"
          />
          <h1 className="store-info-name">{pastReservationData.name}</h1>
        </div>
      </section>

      {/* 基本予約情報 */}
      <section className="past-reservation-section">
        <h3 className="past-reservation-section-title">基本予約情報</h3>
        <div className="past-reservation-info-list">
          <div className="past-reservation-info-item">
            <span className="past-reservation-label">予約番号:</span>
            <span className="past-reservation-value">{pastReservationData.reservationId}</span>
          </div>
          <div className="past-reservation-info-item">
            <span className="past-reservation-label">予約状態:</span>
            <span className="past-reservation-value">{pastReservationData.status}</span>
          </div>
          <div className="past-reservation-info-item">
            <span className="past-reservation-label">予約日:</span>
            <span className="past-reservation-value">{pastReservationData.date}</span>
          </div>
          <div className="past-reservation-info-item">
            <span className="past-reservation-label">予約時間:</span>
            <span className="past-reservation-value">{pastReservationData.time}</span>
          </div>
        </div>
      </section>

      {/* ユーザー情報 */}
      <section className="past-reservation-section">
        <h3 className="past-reservation-section-title">ユーザー情報</h3>
        <div className="past-reservation-info-list">
          <div className="past-reservation-info-item">
            <span className="past-reservation-label">名前:</span>
            <span className="past-reservation-value">{pastReservationData.customerName}</span>
          </div>
          <div className="past-reservation-info-item">
            <span className="past-reservation-label">連絡先:</span>
            <span className="past-reservation-value">{pastReservationData.contact}</span>
          </div>
          <div className="past-reservation-info-item">
            <span className="past-reservation-label">人数:</span>
            <span className="past-reservation-value">{pastReservationData.numberOfPeople}</span>
          </div>
        </div>
      </section>

      {/* 予約先情報 */}
      <section className="past-reservation-section">
        <h3 className="past-reservation-section-title">予約先情報</h3>
        <div className="past-reservation-info-list">
          <div className="past-reservation-info-item">
            <span className="past-reservation-label">分類:</span>
            <span className="past-reservation-value">{pastReservationData.category}</span>
          </div>
          <div className="past-reservation-info-item">
            <span className="past-reservation-label">住所:</span>
            <span className="past-reservation-value">{pastReservationData.address}</span>
          </div>
          <div className="past-reservation-info-item">
            <span className="past-reservation-label">予約サービス:</span>
            <span className="past-reservation-value">{pastReservationData.service}</span>
          </div>
        </div>
      </section>

      {/* 決済情報 */}
      <section className="past-reservation-section">
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
      </section>

      {/* 追加オプション */}
      <section className="past-reservation-section">
        <h3 className="past-reservation-section-title">追加オプション</h3>
        <div className="past-reservation-info-list">
          <div className="past-reservation-info-item">
            <span className="past-reservation-label">要請事項:</span>
            <span className="past-reservation-value">{pastReservationData.specialRequests}</span>
          </div>
        </div>
        <div className="past-reservation-button-group">
          <button className="ok-btn" onClick={handleOkButtonClick}>確認</button>
        </div>
      </section>
    </div>
  );
}

export default PastReservationDetails;