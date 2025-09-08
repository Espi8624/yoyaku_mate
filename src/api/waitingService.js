const API_BASE_URL = "http://localhost:8080/api";

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
    // 待機リストAPI、店舗設定APIを同時に呼出
    const [waitingRes, settingsRes] = await Promise.all([
      fetch(`${API_BASE_URL}/waiting-list?store_id=${storeId}`),
      fetch(`${API_BASE_URL}/store_settings?store_id=${storeId}`)
    ]);

    // 失敗したらエラー発生
    if (!waitingRes.ok) throw new Error(`Failed to fetch waiting list: ${waitingRes.statusText}`);
    if (!settingsRes.ok) throw new Error(`Failed to fetch store settings: ${settingsRes.statusText}`);

    const waitingData = await waitingRes.json();
    const settingsData = await settingsRes.json();
    
    const waitingList = Array.isArray(waitingData.data) ? waitingData.data : [];
    const waitingPartySum = waitingList
      .filter(item => item.status === 'waiting')
      .reduce((sum, item) => sum + (Number(item.party_size) || 0), 0);
      
    const waitingPolicy = settingsData?.data?.settings?.waiting_policy;

    return {
      waitingPartySum,
      estimatedWaitingCount: waitingPolicy?.estimated_waiting_count ?? null,
      maxWaitingCount: waitingPolicy?.max_waiting_count ?? null,
    };
  } catch (error) {
    console.error("Error fetching waiting status:", error);
    // エラー発生時、止めないよう基本値を返却し、エラーを投げ返して呼び出した方から処理出来るようにする
    throw error;
  }
};

/**
 * 新しい待機をサーバーに登録
 * @param {object} payload - サーバに送る待機情報
 * @returns {Promise<Response>}
 */
export const submitWaiting = async (payload) => {
  return fetch(`${API_BASE_URL}/waiting-list`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
};

/**
 * 特定店舗のメニューリスト全体を呼出
 * @param {string} storeId - 店舗ID
 * @returns {Promise<Array>}
 */
export const getMenuList = async (storeId) => {
  const res = await fetch(`${API_BASE_URL}/menu-list?store_id=${storeId || ''}`);
  if (!res.ok) throw new Error('Failed to fetch menu list');
  const data = await res.json();
  return Array.isArray(data.data) ? data.data : [];
};

/**
 * 特定待機番号の詳細情報と、現在待機状況を呼出
 * @param {string} storeId - 店舗ID
 * @param {string} waitingId - 待機ID
 * @returns {Promise<object>}
 */
export const getWaitingDetails = async (storeId, waitingId) => {
  // 詳細情報、リスト情報を並列に呼出
  const [detailsRes, listRes] = await Promise.all([
    fetch(`${API_BASE_URL}/waiting-list?store_id=${storeId || ''}&waiting_id=${waitingId}`),
    fetch(`${API_BASE_URL}/waiting-list?store_id=${storeId || ''}`)
  ]);
  
  if (!detailsRes.ok) throw new Error('Failed to fetch waiting details');
  if (!listRes.ok) throw new Error('Failed to fetch waiting list for count');

  const detailsData = await detailsRes.json();
  const listData = await listRes.json();

  const details = Array.isArray(detailsData.data) ? detailsData.data[0] : (detailsData.data || detailsData);
  const waitingList = Array.isArray(listData.data) ? listData.data : [];
  
  const waitingCount = waitingList.filter(item => item.status === 'waiting').length;
  // TODO: 平均待機時間API追加箇所
  const estimatedWaitingTime = "-"; 

  // 結果返却
  return {
    ...details,
    waiting_count: waitingCount,
    estimated_waiting_time: estimatedWaitingTime,
  };
};

/**
 * 待機ステータスを'cancelled'に変更
 * @param {string} storeId - 店舗ID
 * @param {string} waitingId - 待機ID
 * @returns {Promise<Response>}
 */
export const cancelWaiting = async (storeId, waitingId) => {
  return fetch(`${API_BASE_URL}/waiting-list?action=status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      store_id: storeId || '',
      waiting_id: waitingId,
      status: 'cancelled'
    })
  });
};