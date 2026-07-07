import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getWaitingList, getStoreInfo, subscribeToWaitingList, getQRToken, getStoreSettings } from '../../api/waitingService';
import { QRCodeCanvas } from 'qrcode.react';
import './Board.css';

function Board() {
    const [searchParams] = useSearchParams();
    const storeId = searchParams.get('store_id');

    const [waitingList, setWaitingList] = useState([]);
    const [storeName, setStoreName] = useState('');
    const [qrData, setQrData] = useState(null); // { v_token: '', date: '' }
    const [loading, setLoading] = useState(true);
    const [estimatedWaitTimePerTeam, setEstimatedWaitTimePerTeam] = useState(10); // Default 10 mins
    // eslint-disable-next-line
    const [error, setError] = useState(null);

    // 店舗情報 & 設定取得
    useEffect(() => {
        if (!storeId) return;
        getStoreInfo(storeId)
            .then(info => setStoreName(info.store_name))
            .catch(console.error);

        getStoreSettings(storeId)
            .then(settings => {
                const time = settings?.waiting_policy?.estimated_wait_time;
                if (time && time > 0) {
                    setEstimatedWaitTimePerTeam(time);
                }
            })
            .catch(console.error);
    }, [storeId]);

    // QRトークン取得 (1時間ごとに更新)
    useEffect(() => {
        if (!storeId) return;

        const fetchQR = () => {
            getQRToken(storeId)
                .then(data => {
                    // console.log('QR Token updated:', data);
                    setQrData(data);
                })
                .catch(err => console.error('QR fetch error:', err));
        };

        fetchQR();
        // 1時間(3600000ms)ごとに更新して、日またぎに対応
        const interval = setInterval(fetchQR, 60 * 60 * 1000);
        return () => clearInterval(interval);
    }, [storeId]);

    // 待機リスト (初期取得 + SSE)
    useEffect(() => {
        if (!storeId) return;

        const fetchInitial = async () => {
            try {
                const list = await getWaitingList(storeId);
                setWaitingList(list);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError('データの取得に失敗しました');
                setLoading(false);
            }
        };
        fetchInitial();

        const eventSource = subscribeToWaitingList(
            storeId,
            (newList) => {
                setWaitingList(newList || []);
                setLoading(false);
            },
            () => { } // 接続エラーは無視(自動再接続)
        );

        return () => {
            eventSource.close();
        };
    }, [storeId]);

    // QRコードのURL生成 (Must be before early returns - React Hooks rules)
    const qrUrl = useMemo(() => {
        if (!qrData || !storeId) return '';
        try {
            const url = new URL('/waiting-screen-flow', window.location.origin);
            url.searchParams.set('store_id', storeId);
            if (qrData.v_token) {
                url.searchParams.set('v_token', qrData.v_token);
            }
            return url.toString();
        } catch (e) {
            console.error('URL generation error:', e);
            return '';
        }
    }, [qrData, storeId]);

    if (!storeId) return <div className="board-error">Store ID is missing.</div>;
    if (loading && waitingList.length === 0) return <div className="board-loading">Loading...</div>;

    const notifiedItems = waitingList
        .filter(item => item.status === 'notified')
        .sort((a, b) => {
            const timeA = a.called_time ? new Date(a.called_time).getTime() : 0;
            const timeB = b.called_time ? new Date(b.called_time).getTime() : 0;
            return timeB - timeA; // Descending: Latest first
        });
    const waitingItems = waitingList
        .filter(item => item.status === 'waiting')
        .sort((a, b) => a.queue_number - b.queue_number);

    return (
        <div className="board-container">
            <div className="background-mesh"></div>

            <header className="board-header glass-panel">
                <h1>{storeName || 'Wait Board'}</h1>
                <div className="board-clock">{/* Digital Clock Placeholder */}</div>
            </header>

            <main className="bento-grid">
                {/* LEFT: HERO SECTION (Now Calling) */}
                <section className="bento-item hero-section glass-panel">
                    <div className="section-header">
                        <h2>現在お呼び出し中 <span className="en-sub">NOW CALLING</span></h2>
                        <span className="live-indicator">LIVE</span>
                    </div>

                    <div className="hero-content">
                        {notifiedItems.length === 0 ? (
                            <div className="empty-state-hero">
                                <p>お呼び出し中のお客様はいません</p>
                            </div>
                        ) : (
                            <div className="hero-cards">
                                {notifiedItems.map(item => (
                                    <div key={item.waiting_id} className="hero-card">
                                        <span className="hero-number">#{item.queue_number}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* RIGHT COLUMN */}
                <div className="bento-column">

                    {/* TOP: WAITING LIST */}
                    <section className="bento-item list-section glass-panel">
                        <div className="section-header">
                            <h2>お待ちのお客様 <span className="en-sub">WAITING LIST</span></h2>
                            <span className="count-badge">{waitingItems.length}組</span>
                        </div>

                        <div className="list-content custom-scroll">
                            {waitingItems.length === 0 ? (
                                <p className="empty-message-small">現在お待ちのお客様はいません</p>
                            ) : (
                                <div className="waiting-list-grid">
                                    {waitingItems.map(item => (
                                        <div key={item.waiting_id} className="list-card">
                                            <span className="list-number">#{item.queue_number}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* BOTTOM: INFO & QR */}
                    <section className="bento-item info-section glass-panel">
                        <div className="info-grid">
                            <div className="stats-box">
                                <div className="stat-item">
                                    <span className="stat-label">只今の待ち <span className="en-stat">WAITING</span></span>
                                    <span className="stat-value">{waitingItems.length}<small>組 / groups</small></span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">予想時間 <span className="en-stat">EST. TIME</span></span>
                                    <span className="stat-value">{waitingItems.length * estimatedWaitTimePerTeam}<small>分 / min</small></span>
                                </div>
                            </div>

                            <div className="qr-box">
                                {qrUrl && (
                                    <div className="qr-frame">
                                        <QRCodeCanvas
                                            value={qrUrl}
                                            size={140}
                                            bgColor={"transparent"}
                                            fgColor={"#333"}
                                            level={"H"}
                                        />
                                    </div>
                                )}
                                <p className="qr-hint">スキャンして登録 <br /><span className="en-hint">Scan to Register</span></p>
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            <footer className="board-footer">
                <p>Powered by ルスイ</p>
            </footer>
        </div>
    );
}

export default Board;
