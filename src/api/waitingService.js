import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? "/api" : "http://localhost:8080/api");

/**
 * 現在待機状況と、店舗の待機制作を呼び出す
 * @param {string} storeId 
 * @returns {Promise<{
 *   waitingPartySum: number, 
 *   estimatedWaitingCount: number | null, 
 *   maxWaitingCount: number | null
 * }>}
 */
export const getWaitingStatus = async (storeId) => {
  try {
    const [waitingRes, settingsRes] = await Promise.all([
      axios.get(`${API_BASE_URL}/waiting-list`, {
        params: { store_id: storeId }
      }),
      axios.get(`${API_BASE_URL}/store_settings`, {
        params: { store_id: storeId }
      })
    ]);

    const waitingList = Array.isArray(waitingRes.data.data) ? waitingRes.data.data : [];
    const waitingPartySum = waitingList
      .filter(item => item.status === 'waiting')
      .reduce((sum, item) => sum + (Number(item.party_size) || 0), 0);

    const waitingPolicy = settingsRes.data?.data?.settings?.waiting_policy;

    return {
      waitingPartySum,
      estimatedWaitingCount: waitingPolicy?.estimated_waiting_count ?? null,
      maxWaitingCount: waitingPolicy?.max_waiting_count ?? null,
      enableMenuSelection: waitingPolicy?.enable_menu_selection ?? false,
      requireOneMenuPerPerson: waitingPolicy?.require_one_menu_per_person ?? false,
    };
  } catch (error) {
    console.error("待機状況の取得に失敗しました:", error);
    throw error;
  }
};

/**
 * 店舗設定を取得 (待機ポリシーなど)
 * @param {string} storeId
 * @returns {Promise<object>}
 */
export const getStoreSettings = async (storeId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/store_settings`, {
      params: { store_id: storeId }
    });
    return response.data?.data?.settings || {};
  } catch (error) {
    console.error('[getStoreSettings] Error:', error);
    return {};
  }
};

/**
 * 店舗の待機リスト全体を取得
 * @param {string} storeId
 * @returns {Promise<Array>}
 */
export const getWaitingList = async (storeId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/waiting-list`, {
      params: { store_id: storeId || '' }
    });
    return Array.isArray(response.data.data) ? response.data.data : [];
  } catch (error) {
    console.error('[getWaitingList] エラー:', error);
    throw error;
  }
};

/**
 * 新しい待機をサーバーに登録
 * @param {object} payload - サーバーに送信する待機情報
 * @param {string} vToken - バリデーショントークン
 * @returns {Promise<Response>}
 */
export const submitWaiting = async (payload, vToken) => {
  console.log('[API] submitWaiting called with vToken:', vToken);
  return axios.post(`${API_BASE_URL}/waiting-list`, payload, {
    params: { v_token: vToken }
  });
};

/**
 * 待機リストのリアルタイム更新を購読 (SSE)
 * @param {string} storeId
 * @param {function} onMessage - データ受信時のコールバック
 * @param {function} onError - エラー時のコールバック
 * @returns {EventSource} - 接続オブジェクト (クリーンアップ用)
 */
export const subscribeToWaitingList = (storeId, onMessage, onError) => {
  const url = `${API_BASE_URL}/waiting-list/stream?store_id=${storeId}`;
  const eventSource = new EventSource(url);

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (e) {
      console.error('[SSE] JSON parse error:', e);
    }
  };

  eventSource.onerror = (error) => {
    console.warn('[SSE] Connection error:', error);
    if (onError) onError(error);
  };

  return eventSource;
};

/**
 * 店舗のQRトークンを取得 (Board用)
 * @param {string} storeId
 * @returns {Promise<{v_token: string, date: string}>}
 */
export const getQRToken = async (storeId) => {
  try {
    // 認証不要に変更された endpoint
    const response = await axios.get(`${API_BASE_URL}/waiting-list`, {
      params: {
        action: 'qr_token',
        store_id: storeId
      }
    });
    return response.data.data;
  } catch (error) {
    console.error('[getQRToken] エラー:', error);
    throw error;
  }
};

/**
 * 特定店舗のメニューリスト全体を呼出
 * @param {string} storeId - 店舗ID
 * @returns {Promise<Array>}
 */
export const getMenuList = async (storeId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/menu-list`, {
      params: { store_id: storeId || '' }
    });

    // デバッグ: APIレスポンスの内容を確認（必要に応じてコメント解除）
    // console.log('[getMenuList] APIレスポンス全体:', response.data);
    // console.log('[getMenuList] メニューデータ:', response.data.data);

    // 画像フィールドの確認（必要に応じてコメント解除）
    // if (Array.isArray(response.data.data) && response.data.data.length > 0) {
    //   console.log('[getMenuList] 最初のメニューアイテムのキー:', Object.keys(response.data.data[0]));
    //   console.log('[getMenuList] 最初のメニューアイテム:', response.data.data[0]);
    // }

    return Array.isArray(response.data.data) ? response.data.data : [];
  } catch (error) {
    console.error('[getMenuList] エラー:', error);
    throw new Error('メニューリストの取得に失敗しました');
  }
};

/**
 * 特定待機番号の詳細情報と、現在待機状況を呼出
 * @param {string} storeId - 店舗ID
 * @param {string} waitingId - 待機ID
 * @returns {Promise<object>}
 */
export const getWaitingDetails = async (storeId, waitingId) => {
  try {
    console.log('[getWaitingDetails] リクエスト:', { storeId, waitingId });

    // 以前の方式（全リスト取得）に戻しつつ、予想時間計算ロジックをフロントエンドに残す
    // /api/waiting-list-user が404を返す問題があるため、確実な /api/waiting-list を使用
    const [listRes, settingsRes] = await Promise.all([
      axios.get(`${API_BASE_URL}/waiting-list`, {
        params: { store_id: storeId || '' }
      }),
      axios.get(`${API_BASE_URL}/store_settings`, {
        params: { store_id: storeId || '' }
      })
    ]);

    // 1. リストから該当データを検索
    const waitingList = Array.isArray(listRes.data.data) ? listRes.data.data : (Array.isArray(listRes.data) ? listRes.data : []);
    const details = waitingList.find(item => item.waiting_id === waitingId);

    console.log('[getWaitingDetails] 検索結果:', details);

    if (!details) {
      // 見つからない場合はエラー (これによりローカルストレージクリア等のフローが動く)
      const error = new Error('指定されたwaiting_idのデータが見つかりません');
      error.response = { status: 404 };
      throw error;
    }

    // 2. 待機数を計算 (自分より前の waiting/notified の数)
    // リストは通常古い順になっているはずだが、queue_numberで確実にソートしてカウント
    const activeItems = waitingList
      .filter(item => item.status === 'waiting' || item.status === 'notified')
      .sort((a, b) => a.queue_number - b.queue_number);

    // 自分より前の人数をカウント
    let waitingCount = 0;
    for (let i = 0; i < activeItems.length; i++) {
      if (activeItems[i].waiting_id === waitingId) {
        waitingCount = i; // 0-indexed count implies number of people ahead
        break;
      }
    }

    // 全体の待機数 (表示用)
    const currentWaitingCount = activeItems.length;

    // 3. 設定からチームあたりの時間を取得
    const waitingPolicy = settingsRes.data?.data?.settings?.waiting_policy;
    const minutesPerTeam = waitingPolicy?.estimated_wait_time > 0 ? waitingPolicy.estimated_wait_time : 10;

    // 4. 時間計算
    const totalEstimatedMinutes = waitingCount * minutesPerTeam;
    const estimatedWaitingTime = totalEstimatedMinutes > 0 ? `${totalEstimatedMinutes} mins` : "0 mins";

    return {
      ...details,
      waiting_count: currentWaitingCount,
      estimated_waiting_time: estimatedWaitingTime,
    };
  } catch (error) {
    console.error('[getWaitingDetails] エラー:', error);
    throw error;
  }
};

/**
 * 待機ステータスを'cancelled'に変更
 * @param {string} storeId - 店舗ID
 * @param {string} waitingId - 待機ID
 * @returns {Promise<Response>}
 */
export const cancelWaiting = async (storeId, waitingId) => {
  try {
    const response = await axios.patch(
      `${API_BASE_URL}/waiting-list?action=status`,
      {
        store_id: storeId || '',
        waiting_id: waitingId,
        status: 'cancelled'
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    console.log('[cancelWaiting] 成功:', response.data);
    return response;
  } catch (error) {
    console.error('[cancelWaiting] エラー:', error);
    console.error('[cancelWaiting] エラー詳細:', error.response?.data);
    throw error;
  }
};

/**
 * 店舗情報を取得
 * @param {string} storeId - 店舗ID
 * @returns {Promise<object>}
 */
export const getStoreInfo = async (storeId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/provider_store`, {
      params: { store_id: storeId }
    });
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

/**
 * AIチャットボット用リアルタイム店舗コンテキストデータ取得
 * @param {string} storeId - 店舗ID
 * @returns {Promise<{
 *   store_name: string,
 *   phone: string,
 *   opening_hours: string,
 *   current_wait_count: number,
 *   estimated_wait_time: number,
 *   max_capacity: number,
 *   last_updated: string
 * }>}
 */
export const getStoreAIContext = async (storeId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/public/store_ai_context`, {
      params: { store_id: storeId }
    });
    return response.data.data;
  } catch (error) {
    console.error('AI Store Context 取得失敗:', error);
    // 失敗時はデフォルト値（空オブジェクト）を返すかエラーを投げる -> チャットボットで処理
    throw error;
  }
};