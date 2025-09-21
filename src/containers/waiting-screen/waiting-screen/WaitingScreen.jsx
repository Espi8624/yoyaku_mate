import React, { useState, useEffect, useRef } from "react";
import { useWaitingScreen } from "../WaitingScreenContext";
import useTranslation from "../../../hook/useTranslation";
import { getMenuList, getWaitingDetails } from "../../../api/waitingService";
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
    handleCancel
  } = context;

  const t = useTranslation(selectedLanguageCode);
  const waitingScreenTexts = t.waiting_screen;

  // ステータス管理
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [waitingDetails, setWaitingDetails] = useState({});
  const [menuList, setMenuList] = useState([]);
  const [showCancelPopup, setShowCancelPopup] = useState(false);
  const [showCalledPopup, setShowCalledPopup] = useState(false); 

  // ポーリング用のref
  const pollingRef = useRef(null);

  // データ取得関数
  const loadAllData = async () => {
    if (!storeId || !waitingId) {
      setIsLoading(false);
      setError("店舗情報または待機番号がありません。");
      return;
    }
    try {
      const [details, menu] = await Promise.all([
        getWaitingDetails(storeId, waitingId),
        getMenuList(storeId)
      ]);
      console.log("[loadAllData] details:", details);

      const safeDetails = details || {};
      // status が called ならポップアップを表示
      if (safeDetails.status === "called") {
        setShowCalledPopup(true);
      }

      setWaitingDetails(safeDetails);
      setMenuList(menu || []);
      setError(null);
    } catch (err) {
      // console.error("[loadAllData] getWaitingDetails error:", err);
      // console.log("[loadAllData] error.response?.status:", err?.response?.status);

      if (err?.response?.status === 404 || err?.response?.status === 410) {
        // console.warn("[loadAllData] waiting finished → keep popup open");
        // 404 の場合もポップアップを表示し続ける
        setShowCalledPopup(true);
        setError(null);
      } else {
        setError("データの読み込みに失敗しました。");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 初回＆ポーリング
  useEffect(() => {
    if (!restored) return;
    let isMounted = true;
    setIsLoading(true);
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
  }, [storeId, waitingId, restored]);

  return (
    <div className="waiting-section">
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
            <label className="preview-item-label">{waitingScreenTexts.estimated_wait_time_label}</label>
            <div className="preview-item-value">{waitingDetails.estimated_waiting_time || "-"}</div>
          </form>

          <MenuDisplay menuList={menuList} texts={waitingScreenTexts} />

          <button className="confirmation-btn cancel-btn" onClick={() => setShowCancelPopup(true)}>
            予約をキャンセル
          </button>

          {/* 取り消しポップアップ */}
          {showCancelPopup && (
            <div className="congestion-popup-overlay">
              <div className="congestion-popup-modal cancel-modal">
                <button
                  className="congestion-popup-close-btn"
                  onClick={() => setShowCancelPopup(false)}
                  aria-label="閉じる"
                  type="button"
                >×</button>
                <div className="congestion-popup-message">
                  予約をキャンセルいたします
                </div>
                <div className="congestion-popup-actions">
                  <button
                    className="confirmation-btn"
                    onClick={handleCancel}
                    type="button"
                  >
                    確認
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 呼び出しポップアップ（閉じるボタンなし・表示しっぱなし） */}
          {showCalledPopup && (
            <div className="congestion-popup-overlay">
              <div className="congestion-popup-modal">
                <div className="congestion-popup-message">
                  お待たせいたしました。<br />
                  只今ご案内いたします。
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
