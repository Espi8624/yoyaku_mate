import { useEffect, useState } from 'react';
import './StoreInfoPage.css';
import { useParams } from 'react-router-dom';

function StoreInfoPage() {
    const { storeId } = useParams();
    const [storeInfo, setStoreInfo] = useState(null);
    const [storeMenus, setStoreMenus] = useState([]);
    const [storeComments, setStoreComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // 가게 정보 가져오기
                const storeInfoResponse = await fetch(`http://localhost:8080/provider/store-info?store_id=${storeId}`);
                if (!storeInfoResponse.ok) throw new Error('Failed to fetch store info');
                const storeInfoData = await storeInfoResponse.json();
                setStoreInfo(storeInfoData);

                // 메뉴 정보 가져오기
                const storeMenusResponse = await fetch(`http://localhost:8080/provider/store-menus?store_id=${storeId}`);
                if (!storeMenusResponse.ok) throw new Error('Failed to fetch store menus');
                const storeMenusData = await storeMenusResponse.json();
                setStoreMenus(storeMenusData);

                // 댓글 정보 가져오기
                const storeCommentsResponse = await fetch(`http://localhost:8080/provider/store-comments?store_id=${storeId}`);
                if (!storeCommentsResponse.ok) throw new Error('Failed to fetch store comments');
                const storeCommentsData = await storeCommentsResponse.json();
                setStoreComments(storeCommentsData);

                setLoading(false);
            } catch (err) {
                console.error(err);
                setError(err.message);
                setLoading(false);
            }
        };

        fetchData();
    }, [storeId]);

    // 予約ボタンクリックイベントハンドラ
    const handleReserveClick = () => {
        alert('予約機能は現在開発中です。');
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div className="store-info-page">
            {/* 店位置 (Google Maps プレイスホルダ) */}
            <div className="section">
                <div className="map-placeholder">
                    <p>Google Maps 配置 (今後地図 APIに切り替える予定)</p>
                </div>
            </div>

            {/* 店ロゴ、店名 */}
            {storeInfo && (
                <>
                    <div className="store-info-name-wrap">
                        <img
                            src={storeInfo.logo || 'https://via.placeholder.com/60'}
                            alt={`${storeInfo.store_name}`}
                            className="store-info-logo"
                        />
                        <h1 className="store-info-name">{storeInfo.store_name}</h1>
                    </div>

                    {/* 店分類、店評価 */}
                    <div className="section-category-rating">
                        <p className="info-description-category">{storeInfo.store_category}</p>
                        <p className="info-description-rating">{storeInfo.store_rating}</p>
                    </div>

                    {/* 店説明 */}
                    <div className="section">
                        <div className="info-label">
                            <strong>説明</strong>
                        </div>
                        <p className="info-description">{storeInfo.store_description}</p>
                    </div>

                    {/* 店詳細情報 */}
                    <div className="section">
                        <div className="info-label">
                            <strong>住所</strong>
                        </div>
                        <p className="info-description">{storeInfo.store_address}</p>

                        <div className="info-label">
                            <strong>電話番号</strong>
                        </div>
                        <p className="info-description">{storeInfo.store_tel_number}</p>

                        <div className="info-label">
                            <strong>ホームページ</strong>
                        </div>
                        <p className="info-description">
                            <a
                                href={storeInfo.store_official_web_site}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {storeInfo.store_official_web_site}
                            </a>
                        </p>

                        <div className="info-label">
                            <strong>営業時間</strong>
                        </div>
                        <ul className="hours-list">
                            {storeInfo && storeInfo.business_hours ? (
                                Object.entries(storeInfo.business_hours).map(([day, hours], index) => {
                                    // 영어 요일을 일본어로 변환
                                    const dayToJapanese = {
                                        monday: "月曜日",
                                        tuesday: "火曜日",
                                        wednesday: "水曜日",
                                        thursday: "木曜日",
                                        friday: "金曜日",
                                        saturday: "土曜日",
                                        sunday: "日曜日",
                                    };

                                    return (
                                        <li key={index} className="hours-item">
                                            {dayToJapanese[day]}: {hours.open} - {hours.close}
                                        </li>
                                    );
                                })
                            ) : (
                                <li className="hours-item">営業時間情報がありません。</li>
                            )}
                        </ul>
                    </div>
                </>
            )}

            {/* メニュー情報 */}
            <div className="section">
                <h2>メニュー</h2>
                {storeMenus && storeMenus.length > 0 ? (
                    <ul className="menu-list">
                        {storeMenus.map((item, index) => (
                            <li key={index} className="menu-item">
                                {item.menu_name} - {item.price}円
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>メニューがありません。</p>
                )}
            </div>

            {/* コメント */}
            <div className="comments-section">
                <h2>コメント</h2>
                {storeComments && storeComments.length > 0 ? (
                    storeComments.map((comment, index) => (
                        <div key={index} className="comment">
                            <strong>{comment.user_name}:</strong> {comment.comment_text} (評価:{' '}
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