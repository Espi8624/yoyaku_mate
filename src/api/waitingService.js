import axios from 'axios';

const API_BASE_URL = "https://saboten-server.fly.dev/api";

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
    };
  } catch (error) {
    console.error("待機状況の取得に失敗しました:", error);
    throw error;
  }
};

/**
 * 新しい待機をサーバーに登録
 * @param {object} payload - サーバ에 보낼 대기 정보
 * @param {string} vToken - 보안 토큰
 * @returns {Promise<Response>}
 */
export const submitWaiting = async (payload, vToken) => {
  console.log('[API] submitWaiting called with vToken:', vToken);
  return axios.post(`${API_BASE_URL}/waiting-list`, payload, {
    params: { v_token: vToken }
  });
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

    const [detailsRes, listRes] = await Promise.all([
      axios.get(`${API_BASE_URL}/waiting-list`, {
        params: {
          store_id: storeId || '',
          waiting_id: waitingId
        }
      }),
      axios.get(`${API_BASE_URL}/waiting-list`, {
        params: { store_id: storeId || '' }
      })
    ]);

    console.log('[getWaitingDetails] detailsRes.data:', detailsRes.data);

    // ★ 配列の場合、waiting_idが一致するものを探す
    let details;
    if (Array.isArray(detailsRes.data.data)) {
      details = detailsRes.data.data.find(item => item.waiting_id === waitingId);
      if (!details) {
        throw new Error('指定されたwaiting_idのデータが見つかりません');
      }
    } else {
      details = detailsRes.data.data || detailsRes.data;
    }

    console.log('[getWaitingDetails] 取得したdetails:', details);

    const waitingList = Array.isArray(listRes.data.data) ? listRes.data.data : [];

    const waitingCount = waitingList.filter(item => item.status === 'waiting').length;
    const estimatedWaitingTime = "-";

    return {
      ...details,
      waiting_count: waitingCount,
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
    return response.data;
  } catch (error) {
    console.error('店舗情報の取得に失敗しました:', error);
    throw error;
  }
};