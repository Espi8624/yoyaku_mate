import { useState, useEffect, useCallback } from "react";
import { getWaitingDetails, getMenuList, subscribeToWaitingStatus } from "../../api/waitingService";
import { debugLog } from "../../utils/debugLog";

/**
 * 待機状況を監視するカスタムフック (初回取得 + SSE購読)。
 * 「何を表示するか」と「どうデータを取るか」を切り離す。
 *
 * ・WaitingScreenProvider から1回だけ呼ぶこと。
 *   以前は WaitingScreen(step3) の内部にあり、FlowController も復元判定のために
 *   同じ getWaitingDetails を別途叩いていたため、同じデータを2回取得していた
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
                setError("__NOT_FOUND__"); // 404専用マーカー
            } else {
                setError("データの読み込みに失敗しました。");
            }
        }
    }, [storeId, waitingId]);

    // 監視対象(待機)が切り替わったら、前の待機のステータスを必ず捨てる
    // ・Provider側で保持するようになったため、このフックは画面遷移では破棄されない。
    //   リセットして再登録した直後に前回の 'cancelled' が残っていると、
    //   新しい待機なのに取消完了画面へ飛んでしまう
    useEffect(() => {
        setStatus(null);
        setDetails({});
        setError(null);
    }, [storeId, waitingId]);

    useEffect(() => {
        // enabled=false の間は購読しない
        if (!enabled || !storeId || !waitingId) return;

        // マウント直後に初期データ取得
        fetchData();

        // SSEでのリアルタイム監視を開始
        const eventSource = subscribeToWaitingStatus(
            storeId,
            waitingId,
            (updatedDetails) => {
                debugLog("[useWaitingStatus] SSE受信:", updatedDetails);
                if (updatedDetails) {
                    setStatus(updatedDetails.status || null);
                    setDetails(updatedDetails);
                }
            },
            (err) => {
                console.error("[useWaitingStatus] SSEエラー:", err);
                setError("接続状況が不安定です。自動的に再接続を試みます。");
            }
        );

        return () => {
            // アンマウント時に接続をクローズ
            eventSource.close();
        };
    }, [fetchData, enabled, storeId, waitingId]);

    return { details, menuList, status, error };
}

export default useWaitingStatus;
