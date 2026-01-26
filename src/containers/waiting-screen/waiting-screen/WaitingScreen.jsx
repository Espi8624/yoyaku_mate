import React, { useState, useEffect, useRef, useCallback } from "react";
import { useWaitingScreen } from "../WaitingScreenContext";
import useTranslation from "../../../hook/useTranslation";
import { getMenuList, getWaitingDetails, getStoreInfo } from "../../../api/waitingService";
import MenuDisplay from "./MenuDisplay";
import "./WaitingScreen.css";

function WaitingScreen() {
  const context = useWaitingScreen();

  // ローカルストレージからstoreId, waitingIdを復元
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    if (!context.storeId || !context.waitingId) {
      const storedStoreId = localStorage.getItem("store_id");
      const storedWaitingId = localStorage.getItem("waiting_id");
      if (storedStoreId && storedWaitingId) {
        context.setStoreId && context.setStoreId(storedStoreId);
        context.setWaitingId && context.setWaitingId(storedWaitingId);
      }
    }
    setRestored(true);
  }, [context]);

  const {
    storeId,
    waitingId,
    selectedLanguageCode,
    handleCancel,
    setStep, // 追加
  } = context;

  const t = useTranslation(selectedLanguageCode);
  const waitingScreenTexts = t.waiting_screen;

  // ステータス管理
  const [error, setError] = useState(null);
  const [waitingDetails, setWaitingDetails] = useState({});
  const [menuList, setMenuList] = useState([]);
  const [storeName, setStoreName] = useState('');
  const [showCancelPopup, setShowCancelPopup] = useState(false);

  // ポーリング用のref
  const pollingRef = useRef(null);

  // 店舗情報を初回のみ取得
  useEffect(() => {
    if (!storeId || !restored) return;

    const fetchStoreInfo = async () => {
      try {
        const storeInfo = await getStoreInfo(storeId);
        console.log("[fetchStoreInfo] storeInfo:", storeInfo);
        setStoreName(storeInfo?.data?.store_name || '');
      } catch (err) {
        console.error("店舗情報の取得に失敗:", err);
      }
    };

    fetchStoreInfo();
  }, [storeId, restored]);

  // データ取得関数（待機情報とメニューのみ）
  const loadAllData = useCallback(async () => {
    if (!storeId || !waitingId) {
      setError("店舗情報または待機番号がありません。");
      return;
    }

    console.log("[loadAllData] リクエストパラメータ:", { storeId, waitingId });

    try {
      const [details, menu] = await Promise.all([
        getWaitingDetails(storeId, waitingId),
        getMenuList(storeId)
      ]);

      console.log("[loadAllData] APIレスポンス details:", details);
      console.log("[loadAllData] waiting_id一致確認:", {
        localStorage: waitingId,
        response: details?.waiting_id,
        match: waitingId === details?.waiting_id
      });

      const safeDetails = details || {};

      // ★ 取得したデータのwaiting_idが一致しない場合はエラー
      if (safeDetails.waiting_id && safeDetails.waiting_id !== waitingId) {
        console.error("[loadAllData] waiting_idの不一致を検出:", {
          expected: waitingId,
          actual: safeDetails.waiting_id
        });
        // ローカルストレージをクリアして再登録を促す
        localStorage.removeItem("waiting_id");
        localStorage.removeItem("store_id");
        localStorage.removeItem("v_token");
        setError("待機情報が見つかりません。再度登録してください。");
        return;
      }

      // ★ ステータスチェック (Cancelled / Absence / Notified)
      if (safeDetails.status === "cancelled") {
        if (!context.cancellationReason) {
          context.setCancellationReason && context.setCancellationReason('store');
        }
        return;
      }

      if (safeDetails.status === "absence") { // Changed from no_show to absence
        if (!context.cancellationReason) {
          context.setCancellationReason && context.setCancellationReason('absence');
        }
        return;
      }

      // ★ notifiedステータスをチェックしてstep 4に遷移
      if (safeDetails.status === "notified") {
        // ポーリングを停止
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
        }
        // step 4 (NotifiedScreen)に遷移
        if (setStep) {
          setStep(4);
        }
        return;
      }

      setWaitingDetails(safeDetails);
      setMenuList(menu || []);
      setError(null);
    } catch (err) {
      console.error("[loadAllData] エラー:", err);
      if (err?.response?.status === 404 || err?.response?.status === 410) {
        // データが見つからない場合(404)は、店舗削除とみなす
        if (!context.cancellationReason) {
          context.setCancellationReason && context.setCancellationReason('store');
        }
        // ローカルストレージクリアはContext側かここで行うが、CancelledScreen表示のために状態保持が望ましい
        localStorage.removeItem("waiting_id");
        localStorage.removeItem("store_id");
        localStorage.removeItem("v_token");

      } else {
        setError("データの読み込みに失敗しました。");
      }
    } finally {
      // setIsLoading(false); // Removed
    }
  }, [storeId, waitingId, setStep, context]);

  useEffect(() => {
    if (!restored) return;
    let isMounted = true;
    setError(null);

    loadAllData();

    pollingRef.current = setInterval(() => {
      if (isMounted) {
        loadAllData();
      }
    }, 5000);

    return () => {
      isMounted = false;
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [loadAllData, restored]);

  return (
    <div className="waiting-section">
      {/* 店名を表示 */}
      {storeName && (
        <div className="store-name-header">
          <h2>{storeName}</h2>
        </div>
      )}

      <div className="preview-label">{waitingScreenTexts.label_1}</div>
      {waitingScreenTexts.label_2 && (
        <div className="waiting-label-2">{waitingScreenTexts.label_2}</div>
      )}
      {error ? (
        <div className="waiting-section">{error}</div>
      ) : (
        <>
          <form className="preview-form">
            <div className="waiting-number-label">{waitingScreenTexts.waiting_number_label}</div>
            <div className="waiting-number-value">
              {waitingDetails.queue_number || '-'}
            </div>
            <label className="preview-item-label">{waitingScreenTexts.party_size_label}</label>
            <div className="preview-item-value">{waitingDetails.party_size || '-'}</div>
            <label className="preview-item-label">{waitingScreenTexts.note_label}</label>
            <div className="preview-item-value">{waitingDetails.notes || '-'}</div>
            <label className="preview-item-label">{waitingScreenTexts.current_waiting_label}</label>
            <div className="preview-item-value">{waitingDetails.waiting_count - 1 || 0}{waitingScreenTexts.group_label}</div>

            {/* 登録時間を表示 */}
            <label className="preview-item-label">
              {waitingScreenTexts.registration_time_label}
            </label>
            <div className="preview-item-value">
              {waitingDetails.registration_time ? (() => {
                const date = new Date(waitingDetails.registration_time);
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
              })() : '-'}
            </div>

            <label className="preview-item-label">{waitingScreenTexts.estimated_wait_time_label}</label>
            <div className="preview-item-value">{waitingDetails.estimated_waiting_time || "-"}</div>
          </form>

          {/* Display selected menu items if any */}
          {waitingDetails.menu_items && waitingDetails.menu_items.length > 0 && (
            <div className="menu-container" style={{ marginBottom: '24px' }}>
              <div className="preview-label" style={{ fontSize: '1.1em', marginBottom: '12px' }}>{waitingScreenTexts.pre_order}</div>
              <div className="preview-menu-list">
                {waitingDetails.menu_items.map((item, index) => {
                  // Find the full menu object to get the image URL
                  const fullMenu = menuList.find(m => m.menu_id === item.menu_id);
                  const imageUrl = fullMenu ? fullMenu.menu_image_url : null;

                  return (
                    <div key={index} className="preview-menu-item">
                      {imageUrl ? (
                        <img src={imageUrl} alt={item.name} className="preview-menu-image" />
                      ) : (
                        <div className="preview-menu-placeholder">No Image</div>
                      )}
                      <div className="preview-menu-info">
                        <div className="preview-menu-header">
                          <span className="preview-menu-name">{item.name}</span>
                          <span className="preview-menu-quantity">x{item.quantity}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <MenuDisplay menuList={menuList} texts={waitingScreenTexts} />

          <button className="confirmation-btn cancel-btn" onClick={() => setShowCancelPopup(true)}>
            {waitingScreenTexts.cancel_reservation}
          </button>

          {/* 取り消しポップアップ */}
          {showCancelPopup && (
            <div className="congestion-popup-overlay">
              <div className="congestion-popup-modal cancel-modal">
                <button
                  className="congestion-popup-close-btn"
                  onClick={() => setShowCancelPopup(false)}
                  aria-label={waitingScreenTexts.cancel_popup.close}
                  type="button"
                >×</button>
                <div className="congestion-popup-message">
                  {waitingScreenTexts.cancel_popup.message}
                </div>
                <div className="congestion-popup-actions">
                  <button
                    className="confirmation-btn"
                    onClick={handleCancel}
                    type="button"
                  >
                    {waitingScreenTexts.cancel_popup.confirm}
                  </button>
                </div>
              </div>
            </div>
          )}


        </>
      )}
    </div>
  );
}

export default WaitingScreen;
