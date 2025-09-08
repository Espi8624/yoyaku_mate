import React, { useState, useEffect } from "react";
import { useWaitingScreen } from "../WaitingScreenContext";
import useTranslation from "../../../hook/useTranslation";
import { getMenuList, getWaitingDetails, cancelWaiting } from "../../../api/waitingService";
import MenuDisplay from "./MenuDisplay"; 
import "./WaitingScreen.css";

function WaitingScreen() {
  const {
    storeId,
    waitingId,
    selectedLanguageCode,
    goBackToInputStep
  } = useWaitingScreen();
  
  const t = useTranslation(selectedLanguageCode);
  const waitingScreenTexts = t.waiting_screen;

  // ステータス管理
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [waitingDetails, setWaitingDetails] = useState({});
  const [menuList, setMenuList] = useState([]);
  const [showCancelPopup, setShowCancelPopup] = useState(false);

  useEffect(() => {
    // storeIdやwaitingIdがない場合リーディングを始めない
    if (!storeId || !waitingId) {
      setIsLoading(false);
      setError("店舗情報または待機番号がありません。");
      return;
    }

    const loadAllData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [details, menu] = await Promise.all([
          getWaitingDetails(storeId, waitingId),
          getMenuList(storeId)
        ]);
        setWaitingDetails(details || {});
        setMenuList(menu || []);
      } catch (err) {
        setError("データの読み込みに失敗しました。");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllData();
  }, [storeId, waitingId]); // storeIdやwaitingIdが変わる時のみ、ロードし直す


  const handleCancel = async () => {
    try {
      await cancelWaiting(storeId, waitingId);
      setShowCancelPopup(false);
      goBackToInputStep(); // 成功時最初のページへ移動
    } catch (err) {
      alert("キャンセル処理に失敗しました。");
    }
  };

  if (isLoading) {
    return <div className="waiting-section">Loading...</div>;
  }

  if (error) {
    return <div className="waiting-section">{error}</div>;
  }

  return (
    <div className="waiting-section">
      <div className="preview-label">{waitingScreenTexts.label_1}</div>
      {waitingScreenTexts.label_2 && (
        <div className="waiting-label-2">{waitingScreenTexts.label_2}</div>
      )}
      <form className="preview-form">
        <label className="preview-item-label">{waitingScreenTexts.waiting_number_label}</label>
        <div className="preview-item-value">{waitingDetails.queue_number || '-'}</div>
        <label className="preview-item-label">{waitingScreenTexts.party_size_label}</label>
        <div className="preview-item-value">{waitingDetails.party_size || '-'}</div>
        <label className="preview-item-label">{waitingScreenTexts.note_label}</label>
        <div className="preview-item-value">{waitingDetails.notes || '-'}</div>
        <label className="preview-item-label">{waitingScreenTexts.current_waiting_label}</label>
        <div className="preview-item-value">{waitingDetails.waiting_count || 0}{waitingScreenTexts.group_label}</div>
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
            <div className="congestion-popup-message">予約をキャンセルいたします</div>
            <div className="congestion-popup-actions">
              <button onClick={() => setShowCancelPopup(false)}>いいえ</button>
              <button className="cancel-yes-btn" onClick={handleCancel}>はい</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WaitingScreen;