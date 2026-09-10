import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getWaitingList, getStoreInfo, subscribeToWaitingList, getQRToken, getStoreSettings } from '../../api/waitingService';
import { QRCodeCanvas } from 'qrcode.react';
import styles from "./Board.module.css";

function Board() {
    const [searchParams] = useSearchParams();
    const storeId = searchParams.get('store_id');
    const boardKey = searchParams.get('board_key'); // QRトークン発行の検証用店舗別シークレット

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
        if (!storeId || !boardKey) return;

        const fetchQR = () => {
            getQRToken(storeId, boardKey)
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
    }, [storeId, boardKey]);

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

    // - filter/sortはuseMemoなしだと毎レンダー(storeName取得・1時間毎のQR更新など
    //   waitingListと無関係な状態変化でも)再計算されていた。常時表示の掲示板でwaitingList自体は
    //   頻繁にSSE更新されるため、無関係な再計算を避けるためwaitingList変化時のみに限定する
    const notifiedItems = useMemo(() => waitingList
        .filter(item => item.status === 'notified')
        .sort((a, b) => {
            const timeA = a.called_time ? new Date(a.called_time).getTime() : 0;
            const timeB = b.called_time ? new Date(b.called_time).getTime() : 0;
            return timeB - timeA; // Descending: Latest first
        }), [waitingList]);
    const waitingItems = useMemo(() => waitingList
        .filter(item => item.status === 'waiting')
        .sort((a, b) => a.queue_number - b.queue_number), [waitingList]);

    if (!storeId) return <div className={styles["board-error"]}>Store ID is missing.</div>;
    if (loading && waitingList.length === 0) return <div className={styles["board-loading"]}>Loading...</div>;

    return (
        <div className={styles["board-container"]}>
            <div className={styles["background-mesh"]}></div>

            <main className={styles["bento-grid"]}>
                {/* LEFT: 店名ヘッダー + HERO SECTION (Now Calling) — ヘッダーは左カラム幅のみに縮小 */}
                <div className={styles["left-column"]}>
                    <header className={styles["board-header"]}>
                        <h1>{storeName || 'Wait Board'}</h1>
                        <div className={styles["board-clock"]}>{/* Digital Clock Placeholder */}</div>
                    </header>

                    <section className={`${styles["bento-item"]} ${styles["hero-section"]} ${styles["glass-panel"]}`}>
                        <div className={styles["section-header"]}>
                            <h2>現在お呼び出し中 <span className={styles["en-sub"]}>NOW CALLING</span></h2>
                            <span className={styles["live-indicator"]}>LIVE</span>
                        </div>

                        <div className={styles["hero-content"]}>
                            {notifiedItems.length === 0 ? (
                                <div className={styles["empty-state-hero"]}>
                                    <p>お呼び出し中のお客様はいません</p>
                                </div>
                            ) : (
                                <div className={styles["hero-cards"]}>
                                    {notifiedItems.map(item => (
                                        <div key={item.waiting_id} className={styles["hero-card"]}>
                                            <span className={styles["hero-number"]}>#{item.queue_number}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* RIGHT COLUMN */}
                <div className={styles["bento-column"]}>

                    {/* TOP: WAITING LIST */}
                    <section className={`${styles["bento-item"]} ${styles["list-section"]} ${styles["glass-panel"]}`}>
                        <div className={styles["section-header"]}>
                            <h2>お待ちのお客様 <span className={styles["en-sub"]}>WAITING LIST</span></h2>
                            <span className={styles["count-badge"]}>{waitingItems.length}組</span>
                        </div>

                        <div className={`${styles["list-content"]} ${styles["custom-scroll"]}`}>
                            {waitingItems.length === 0 ? (
                                <div className={styles["empty-state-list"]}>
                                    <p>現在お待ちのお客様はいません</p>
                                </div>
                            ) : (
                                <div className={styles["waiting-list-grid"]}>
                                    {waitingItems.map(item => (
                                        <div key={item.waiting_id} className={styles["list-card"]}>
                                            <span className={styles["list-number"]}>#{item.queue_number}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* BOTTOM: INFO & QR */}
                    <section className={`${styles["bento-item"]} ${styles["info-section"]} ${styles["glass-panel"]}`}>
                        <div className={styles["info-grid"]}>
                            <div className={styles["stats-box"]}>
                                <div className={styles["stat-item"]}>
                                    <span className={styles["stat-label"]}>只今の待ち <span className={styles["en-stat"]}>WAITING</span></span>
                                    <span className={styles["stat-value"]}>{waitingItems.length}<small>組 / groups</small></span>
                                </div>
                                <div className={styles["stat-item"]}>
                                    <span className={styles["stat-label"]}>予想時間 <span className={styles["en-stat"]}>EST. TIME</span></span>
                                    <span className={styles["stat-value"]}>{waitingItems.length * estimatedWaitTimePerTeam}<small>分 / min</small></span>
                                </div>
                            </div>

                            <div className={styles["qr-box"]}>
                                {qrUrl && (
                                    <div className={styles["qr-frame"]}>
                                        <QRCodeCanvas
                                            value={qrUrl}
                                            size={140}
                                            bgColor={"transparent"}
                                            fgColor={"#333"}
                                            level={"H"}
                                        />
                                    </div>
                                )}
                                <p className={styles["qr-hint"]}>スキャンして登録 <br /><span className={styles["en-hint"]}>Scan to Register</span></p>
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            <footer className={styles["board-footer"]}>
                <p>Powered by oboro</p>
            </footer>
        </div>
    );
}

export default Board;
