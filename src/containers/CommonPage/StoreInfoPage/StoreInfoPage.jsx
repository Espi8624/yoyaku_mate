import './StoreInfoPage.css';

function StoreInfoPage() {
    // ダミーデータ
    const storeInfoData = {
        storeId: 1,
        logo: 'https://via.placeholder.com/60',
        name: '川崎食堂',
        category: '和食',
        rating: 4.5,
        description: '地元の新鮮な食材を使用した和食専門店です。',
        address: '神奈川県川崎市中原区新丸子町1-1',
        phone: '044-123-4567',
        website: 'https://example.com',
        storeHours: [
            { day: '月曜日', time: '11:00 - 20:00' },
            { day: '火曜日', time: '11:00 - 20:00' },
            { day: '水曜日', time: '11:00 - 20:00' },
            { day: '木曜日', time: '11:00 - 20:00' },
            { day: '金曜日', time: '11:00 - 21:00' },
            { day: '土曜日', time: '10:00 - 21:00' },
            { day: '日曜日', time: '10:00 - 20:00' },
        ],
        menu: [
            { name: '寿司', price: 1500 },
            { name: '天ぷら', price: 1200 },
            { name: 'うどん', price: 800 },
        ],
        comments: [
            { user: 'user1', comment: 'とても美味しかったです！', rating: 5 },
            { user: 'user2', comment: 'サービスが良かったです。', rating: 4 },
            { user: 'user3', comment: 'また行きたいです。', rating: 5 },
        ],
    };

    // 予約ボタンクリックイベントハンドラ
    const handleReserveClick = () => {
        alert('予約機能は現在開発中です。');
    };

    return (
        <div className="store-info-page">
            {/* 店位置 (Google Maps プレイスホルダ) */}
            <div className="section">
                {/* <div className="info-label">
                    <strong>위치:</strong>
                </div> */}
                <div className="map-placeholder">
                    <p>Google Maps 配置 (今後地図 APIに切り替える予定)</p>
                </div>
            </div>

            {/* 店ロゴ、店名 */}
            <div className="store-info-name-wrap">
                <img
                    src={storeInfoData.logo}
                    alt={`${storeInfoData.name}`}
                    className="store-info-logo"
                />
                <h1 className="store-info-name">{storeInfoData.name}</h1>
            </div>

            {/* 店分類、店評価 */}
            <div className="section-category-rating">
                {/* <div className="info-label">
                    <strong>分類</strong>
                </div> */}
                <p className="info-description-category">{storeInfoData.category}</p>

                {/* <div className="info-label">
                    <strong>評価</strong>
                </div> */}
                <p className="info-description-rating">{storeInfoData.rating}</p>
            </div>

            {/* 店説明 */}
            <div className="section">
                <div className="info-label">
                    <strong>説明</strong>
                </div>
                <p className="info-description">{storeInfoData.description}</p>
            </div>

            {/* 店詳細情報 */}
            <div className="section">
                <div className="info-label">
                    <strong>住所</strong>
                </div>
                <p className="info-description">{storeInfoData.address}</p>

                <div className="info-label">
                    <strong>電話番号</strong>
                </div>
                <p className="info-description">{storeInfoData.phone}</p>

                <div className="info-label">
                    <strong>ホームページ</strong>
                </div>
                <p className="info-description">
                    <a
                        href={storeInfoData.website}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {storeInfoData.website}
                    </a>
                </p>

                <div className="info-label">
                    <strong>営業時間</strong>
                </div>
                <ul className="hours-list">
                    {storeInfoData.storeHours.map((hour, index) => (
                        <li key={index} className="hours-item">
                            {hour.day}: {hour.time}
                        </li>
                    ))}
                </ul>
            </div>

            {/* メニュー情報 */}
            <div className="section">
                <h2>メニュー</h2>
                <ul className="menu-list">
                    {storeInfoData.menu.map((item, index) => (
                        <li key={index} className="menu-item">
                            {item.name} - {item.price}円
                        </li>
                    ))}
                </ul>
            </div>

            {/* コメント */}
            <div className="comments-section">
                <h2>コメント</h2>
                {storeInfoData.comments && storeInfoData.comments.length > 0 ? (
                    storeInfoData.comments.map((comment, index) => (
                        <div key={index} className="comment">
                            <strong>{comment.user}:</strong> {comment.comment} (評価:{' '}
                            {comment.rating})
                        </div>
                    ))
                ) : (
                    <p>コメントがありません。</p>
                )}
            </div>

            {/* 予約ボタン */}
            <div className="reserve-button-wrap">
                <button className="reserve-button" onClick={handleReserveClick}>
                    予約する
                </button>
            </div>
        </div>
    );
}

export default StoreInfoPage;