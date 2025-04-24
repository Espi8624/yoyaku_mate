import './ReservationDetails.css';

function ReservationDetails() {

  // ダミーデータ
  const reservationData = {
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

  const handleUpdateButtonClick = () => {
    alert('更新機能は現在開発中です。');
  };

  const handleCancelButtonClick = () => {
    alert('取消機能は現在開発中です。');
  };

  return (
    <div className="reservation-details-page">
      <h2 className="reservation-page-title">予約内容は下記の通りです</h2>

      {/* 店情報 */}
      <section className="reservation-section">
        <div className="store-info-name-wrap">
          <img
            src={reservationData.logo}
            alt={`${reservationData.name}`}
            className="store-info-logo"
          />
          <h1 className="store-info-name">{reservationData.name}</h1>
        </div>
      </section>

      {/* 基本予約情報 */}
      <section className="reservation-section">
        <h3 className="reservation-section-title">基本予約情報</h3>
        <div className="reservation-info-list">
          <div className="reservation-info-item">
            <span className="reservation-label">予約番号:</span>
            <span className="reservation-value">{reservationData.reservationId}</span>
          </div>
          <div className="reservation-info-item">
            <span className="reservation-label">予約状態:</span>
            <span className="reservation-value">{reservationData.status}</span>
          </div>
          <div className="reservation-info-item">
            <span className="reservation-label">予約日:</span>
            <span className="reservation-value">{reservationData.date}</span>
          </div>
          <div className="reservation-info-item">
            <span className="reservation-label">予約時間:</span>
            <span className="reservation-value">{reservationData.time}</span>
          </div>
        </div>
      </section>

      {/* ユーザー情報 */}
      <section className="reservation-section">
        <h3 className="reservation-section-title">ユーザー情報</h3>
        <div className="reservation-info-list">
          <div className="reservation-info-item">
            <span className="reservation-label">名前:</span>
            <span className="reservation-value">{reservationData.customerName}</span>
          </div>
          <div className="reservation-info-item">
            <span className="reservation-label">連絡先:</span>
            <span className="reservation-value">{reservationData.contact}</span>
          </div>
          <div className="reservation-info-item">
            <span className="reservation-label">人数:</span>
            <span className="reservation-value">{reservationData.numberOfPeople}</span>
          </div>
        </div>
      </section>

      {/* 予約先情報 */}
      <section className="reservation-section">
        <h3 className="reservation-section-title">予約先情報</h3>
        <div className="reservation-info-list">
          <div className="reservation-info-item">
            <span className="reservation-label">分類:</span>
            <span className="reservation-value">{reservationData.category}</span>
          </div>
          <div className="reservation-info-item">
            <span className="reservation-label">住所:</span>
            <span className="reservation-value">{reservationData.address}</span>
          </div>
          <div className="reservation-info-item">
            <span className="reservation-label">予約サービス:</span>
            <span className="reservation-value">{reservationData.service}</span>
          </div>
        </div>
      </section>

      {/* 決済情報 */}
      <section className="reservation-section">
        <h3 className="reservation-section-title">決済情報</h3>
        <div className="reservation-info-list">
          <div className="reservation-info-item">
            <span className="reservation-label">価格:</span>
            <span className="reservation-value">￥{reservationData.price}</span>
          </div>
          <div className="reservation-info-item">
            <span className="reservation-label">決済状態:</span>
            <span className="reservation-value">{reservationData.paymentStatus}</span>
          </div>
          <div className="reservation-info-item">
            <span className="reservation-label">決済手段:</span>
            <span className="reservation-value">{reservationData.paymentMethod}</span>
          </div>
          <div className="reservation-info-item">
            <span className="reservation-label">取消政策:</span>
            <span className="reservation-value">{reservationData.cancellationPolicy}</span>
          </div>
        </div>
      </section>

      {/* 追加オプション */}
      <section className="reservation-section">
        <h3 className="reservation-section-title">追加オプション</h3>
        <div className="reservation-info-list">
          <div className="reservation-info-item">
            <span className="reservation-label">要請事項:</span>
            <span className="reservation-value">{reservationData.specialRequests}</span>
          </div>
        </div>
        <div className="reservation-button-group">
          <button className="reservation-edit-btn" onClick={handleUpdateButtonClick}>変更</button>
          <button className="reservation-cancel-btn" onClick={handleCancelButtonClick}>取消</button>
        </div>
      </section>
    </div>
  );
}

export default ReservationDetails;