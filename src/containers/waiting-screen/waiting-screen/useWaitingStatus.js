import { useState, useEffect, useRef, useCallback } from "react";
import { getWaitingDetails, getMenuList } from "../../../api/waitingService";

// ポーリング間隔 (ミリ秒)
const POLLING_INTERVAL = 3000;

/**
 * 待機状況をポーリングで監視するカスタムフック。
 * WaitingScreen コンポーネントからポーリングロジックを分離し、
 * 「何を表示するか」と「どうデータを取るか」を切り離す。
 *
 * @param {string} storeId - 店舗ID
 * @param {string} waitingId - 待機ID
 * @param {boolean} enabled - ポーリングを実行するか (復元完了後にtrueにする)
 * @returns {{
 *   details: object,        - 待機詳細データ
 *   menuList: Array,        - メニューリスト
 *   status: string|null,   - 現在のステータス文字列 ("waiting"|"notified"|"cancelled"|...)
 *   error: string|null,    - エラーメッセージ
 * }}
 */
function useWaitingStatus(storeId, waitingId, enabled) {
    const [details, setDetails] = useState({});
    const [menuList, setMenuList] = useState([]);
    const [status, setStatus] = useState(null);
    const [error, setError] = useState(null);

    // ポーリング用タイマーref (アンマウント時のクリーンアップに使用)
    const pollingRef = useRef(null);

    const fetchData = useCallback(async () => {
        // storeId/waitingId が未設定の場合はスキップ
        if (!storeId || !waitingId) {
            setError("店舗情報または待機番号がありません。");
            return;
        }

        try {
            // 待機詳細とメニューを並列取得
            const [fetchedDetails, fetchedMenu] = await Promise.all([
                getWaitingDetails(storeId, waitingId),
                getMenuList(storeId),
            ]);

            const safeDetails = fetchedDetails || {};

            // waiting_id の整合性チェック
            if (
                safeDetails.waiting_id &&
                String(safeDetails.waiting_id) !== String(waitingId)
            ) {
                console.error("[useWaitingStatus] waiting_idの不一致:", {
                    expected: waitingId,
                    actual: safeDetails.waiting_id,
                });
                // ローカルストレージをクリアして再登録を促す
                localStorage.removeItem("waiting_id");
                localStorage.removeItem("store_id");
                localStorage.removeItem("v_token");
                setError("待機情報が見つかりません。再度登録してください。");
                return;
            }

            // ステータスと詳細データを更新
            setStatus(safeDetails.status || null);
            setDetails(safeDetails);
            setMenuList(fetchedMenu || []);
            setError(null);
        } catch (err) {
            console.error("[useWaitingStatus] データ取得エラー:", err);

            if (err?.response?.status === 404 || err?.response?.status === 410) {
                // 404: 待機データが存在しない (店舗削除 or 無効なID)
                // 呼び出し元コンポーネントが status ではなく error を見て対応する
                localStorage.removeItem("waiting_id");
                localStorage.removeItem("store_id");
                localStorage.removeItem("v_token");
                setError("__NOT_FOUND__"); // 404専用マーカー
            } else {
                setError("データの読み込みに失敗しました。");
            }
        }
    }, [storeId, waitingId]);

    useEffect(() => {
        // enabled=false の間はポーリングしない (ローカルストレージ復元待ち等)
        if (!enabled) return;

        // マウント直後にデータ取得
        fetchData();

        // 一定間隔でポーリング開始
        pollingRef.current = setInterval(fetchData, POLLING_INTERVAL);

        return () => {
            // アンマウント時にポーリング停止
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, [fetchData, enabled]);

    return { details, menuList, status, error };
}

export default useWaitingStatus;
