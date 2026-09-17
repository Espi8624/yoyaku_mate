import React, { useState, useEffect } from "react";
import { useWaitingScreen } from "../../WaitingScreenContext";
import useTranslation from "../../../../hook/useTranslation";
import { getStoreInfo } from "../../../../api/waitingService";
import MenuDisplay from "./MenuDisplay";
import CongestionPopup from "../../components/CongestionPopup";
import { getTranslatedText } from "../../../../utils/i18nHelper";
import { MAP_CHATBOT_ENABLED } from "../../../../constants/featureFlags";
import ChatbotButton from "../../../chat-bot/ChatbotButton";
import MapButton from '../../map/MapButton';
import useCallChime from "./useCallChime";
import useScreenWakeLock from "./useScreenWakeLock";
import styles from "./WaitingScreen.module.css";

/**
 * 通知状態を表す列挙値
 * - 'idle'     : まだ呼び出されていない (初期状態)
 * - 'showing'  : 呼び出しモーダルを表示中 (チャイム鳴動中)
 * - 'accepted' : ユーザーが「確認」を押した後 (モーダルを再表示しない)
 */
const NOTIFICATION_STATE = {
  IDLE: 'idle',
  SHOWING: 'showing',
  ACCEPTED: 'accepted',
};

function WaitingScreen() {
  const context = useWaitingScreen();

  const {
    storeId,
    selectedLanguageCode,
    handleCancel,
    // ★ 待機ステータスの購読は WaitingScreenProvider が一括で行う。
    //   この画面は結果を受け取って描画するだけ (以前はここでも別途取得していた)
    waitingDetails,
    menuList,
    waitingStatus: status,
    waitingError: error,
  } = context;

  const t = useTranslation(selectedLanguageCode);
  const waitingScreenTexts = t.waiting_screen;

  // 店舗情報 (初回のみ取得)
  const [storeInfo, setStoreInfo] = useState(null);
  useEffect(() => {
    if (!storeId) return;
    getStoreInfo(storeId)
      .then(info => setStoreInfo(info || null))
      .catch(err => console.error("店舗情報の取得に失敗:", err));
  }, [storeId]);

  // -------------------------------------------------------
  // ★ 通知状態管理 (enum パターン)
  // status が 'notified' に変わったタイミングで once だけ通知を起動する
  // -------------------------------------------------------
  const [notificationState, setNotificationState] = useState(NOTIFICATION_STATE.IDLE);

  // 呼び出しチャイム(AudioContextのアンロック含む)と画面常時ONは、
  // この画面の表示ロジックとは独立したブラウザ都合の処理のためフックに切り出している
  const { soundEnabled, enableSound, startChime, stopChime } = useCallChime();
  useScreenWakeLock();

  // status 変化を監視して通知を制御
  useEffect(() => {
    if (status === 'notified' && notificationState === NOTIFICATION_STATE.IDLE) {
      // --- 初めて notified を検知: モーダルを表示し通知を開始 ---
      setNotificationState(NOTIFICATION_STATE.SHOWING);

      // 1. バイブレーション (Android のみ, 初回のみ)
      try {
        if (navigator.vibrate) navigator.vibrate([1000, 500, 1000, 500, 3000]);
      } catch (e) { /* バイブレーション非対応端末は無視 */ }

      // 2. 初回再生し、以降3秒ごとに繰り返す
      startChime();

    } else if (status === 'cancelled' && context.cancellationReason === null) {
      // 呼び出し済み（notificationState !== IDLE）の状態でキャンセルされた場合は不在扱い
      const isAbsence = notificationState !== NOTIFICATION_STATE.IDLE;
      context.setCancellationReason && context.setCancellationReason(isAbsence ? 'absence' : 'store');
    } else if (status === 'no_show' && context.cancellationReason === null) {
      // サーバー側のno_showステータスも不在扱い
      context.setCancellationReason && context.setCancellationReason('absence');
    }
  }, [status, notificationState, context, startChime]);

  // 404エラー時は CancelledScreen に遷移
  useEffect(() => {
    if (error === '__NOT_FOUND__') {
      context.setCancellationReason && context.setCancellationReason('store');
    }
  }, [error, context]);

  // UI 用の派生値
  const [showCancelPopup, setShowCancelPopup] = useState(false);
  const isNotificationShowing = notificationState === NOTIFICATION_STATE.SHOWING;

  // -------------------------------------------------------
  // 確認ボタン押下時: チャイムを止め、通知状態を「確認済み」にする
  // -------------------------------------------------------
  const handleNotificationConfirm = () => {
    stopChime();
    setNotificationState(NOTIFICATION_STATE.ACCEPTED);
  };

  return (
    <div className={`page-container ${styles["waiting-screen-page"]}`}>
      {/* Top Action Bar (Map & Chatbot Buttons) - 機能フラグが無効な間はバー自体を描画しない (空の余白が残るのを防ぐ) */}
      {MAP_CHATBOT_ENABLED && (
        <div className="page-top-bar">
          <div className="page-top-bar-right">
            <MapButton />
            <ChatbotButton />
          </div>
        </div>
      )}

      {/* Store Name Banner (Full width below buttons to support any store name length) */}
      {storeInfo && storeInfo.store_name && (
        <div className={styles["store-name-header"]}>
          <h2>{storeInfo.store_name}</h2>
        </div>
      )}

      {/* ★ 呼び出し通知音バナー: ユーザー操作で AudioContext を確実にアンロックするための導線 */}
      <div className={styles["sound-banner"]}>
        {soundEnabled ? (
          <span>
            🔔 {waitingScreenTexts.sound_banner?.enabled_message}
            {waitingScreenTexts.sound_banner?.enabled_note && (
              <>
                <br />
                {waitingScreenTexts.sound_banner.enabled_note}
              </>
            )}
          </span>
        ) : (
          <>
            <span>🔕 {waitingScreenTexts.sound_banner?.message}</span>
            <button
              type="button"
              className={styles["sound-banner-btn"]}
              onClick={enableSound}
            >
              {waitingScreenTexts.sound_banner?.enable_btn}
            </button>
          </>
        )}
      </div>

      <div className={styles["preview-label"]}>
        {notificationState !== NOTIFICATION_STATE.IDLE
          ? waitingScreenTexts.notified_label_1 || waitingScreenTexts.label_1
          : waitingScreenTexts.label_1}
      </div>
      {waitingScreenTexts.label_2 && (
        <div className={styles["waiting-label-2"]}>
          {notificationState !== NOTIFICATION_STATE.IDLE
            ? waitingScreenTexts.notified_label_2 || waitingScreenTexts.label_2
            : waitingScreenTexts.label_2}
        </div>
      )}

      {error && error !== '__NOT_FOUND__' ? (
        <div className="page-container">{error}</div>
      ) : (
        <>
          <form className={styles["preview-form"]}>
            <div className={styles["preview-info-group"]}>
              <div className={styles["waiting-number-label"]}>{waitingScreenTexts.waiting_number_label}</div>
              <div className={styles["waiting-number-value"]}>
                {waitingDetails.queue_number || '-'}
              </div>
            </div>

            <div className={styles["preview-info-group"]}>
              <label className={styles["preview-item-label"]}>{waitingScreenTexts.party_size_label}</label>
              <div className={styles["preview-item-value"]}>{waitingDetails.party_size || '-'}</div>
            </div>

            <div className={styles["preview-info-group"]}>
              <label className={styles["preview-item-label"]}>{waitingScreenTexts.note_label}</label>
              <div className={styles["preview-item-value"]}>{waitingDetails.notes || '-'}</div>
            </div>

            <div className={styles["preview-info-group"]}>
              <label className={styles["preview-item-label"]}>{waitingScreenTexts.current_waiting_label}</label>
              <div className={styles["preview-item-value"]}>{Math.max(0, waitingDetails.waiting_count - 1)}{waitingScreenTexts.group_label}</div>
            </div>

            <div className={styles["preview-info-group"]}>
              <label className={styles["preview-item-label"]}>
                {waitingScreenTexts.registration_time_label}
              </label>
              <div className={styles["preview-item-value"]}>
                {waitingDetails.registration_time ? (() => {
                  const date = new Date(waitingDetails.registration_time);
                  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                })() : '-'}
              </div>
            </div>

            <div className={styles["preview-info-group"]}>
              <label className={styles["preview-item-label"]}>{waitingScreenTexts.estimated_wait_time_label}</label>
              <div className={styles["preview-item-value"]}>{waitingDetails.estimated_waiting_time || "-"}</div>
            </div>
          </form>

          {/* 事前注文済みメニューの表示 */}
          {waitingDetails.menu_items && waitingDetails.menu_items.length > 0 && (
            <div className={styles["menu-container"]} style={{ marginBottom: '24px' }}>
              <div className={styles["preview-label"]} style={{ fontSize: '1.1em', marginBottom: '12px' }}>{waitingScreenTexts.pre_order}</div>
              <div className={styles["preview-menu-list"]}>
                {waitingDetails.menu_items.map((item, index) => {
                  const fullMenu = menuList.find(m => m.menu_id === item.menu_id);
                  const imageUrl = fullMenu ? fullMenu.menu_image_url : null;

                  let displayName = item.name;
                  if (fullMenu && fullMenu.title_translations) {
                    displayName = getTranslatedText(item.name, fullMenu.title_translations, selectedLanguageCode);
                  }

                  return (
                    <div key={index} className={styles["preview-menu-item"]}>
                      {imageUrl ? (
                        <img src={imageUrl} alt={displayName} className={styles["preview-menu-image"]} />
                      ) : (
                        <div className={styles["preview-menu-placeholder"]}>No Image</div>
                      )}
                      <div className={styles["preview-menu-info"]}>
                        <div className={styles["preview-menu-header"]}>
                          <span className={styles["preview-menu-name"]}>{displayName}</span>
                          <span className={styles["preview-menu-quantity"]}>x{item.quantity}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* メニュー表示設定がONで、かつメニューが1件以上登録されている場合のみ表示 */}
          {context.showMenu && menuList.length > 0 && (
            <MenuDisplay menuList={menuList} texts={waitingScreenTexts} selectedLanguageCode={selectedLanguageCode} />
          )}

          <button className={`${styles["confirmation-btn"]} ${styles["cancel-btn"]}`} onClick={() => setShowCancelPopup(true)}>
            {waitingScreenTexts.cancel_reservation}
          </button>

          {/* キャンセル確認ポップアップ */}
          {showCancelPopup && (
            <div className="popup-overlay">
              <div className="popup-modal">
                <button
                  className="popup-close-btn"
                  onClick={() => setShowCancelPopup(false)}
                  aria-label={waitingScreenTexts.cancel_popup.close}
                  type="button"
                >×</button>
                <p className="popup-message">
                  {waitingScreenTexts.cancel_popup.message}
                </p>
                <div className="popup-actions">
                  <button
                    className="btn-secondary"
                    onClick={() => setShowCancelPopup(false)}
                    type="button"
                    style={{ width: 'auto', padding: '10px 24px' }}
                  >
                    {waitingScreenTexts.cancel_popup.close}
                  </button>
                  <button
                    className="btn-primary"
                    onClick={async () => {
                      setShowCancelPopup(false);
                      await handleCancel();
                    }}
                    type="button"
                    style={{ width: 'auto', padding: '10px 24px' }}
                  >
                    {waitingScreenTexts.cancel_popup.confirm}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ★ 呼び出し通知モーダル */}
          {isNotificationShowing && (
            <div className="popup-overlay">
              <div className="popup-modal" style={{ textAlign: 'center' }}>
                <p className="popup-message" style={{ fontWeight: 'bold' }}>
                  {waitingScreenTexts.call_popup?.message_1}<br />
                  {waitingScreenTexts.call_popup?.message_2}
                </p>
                <div className="popup-actions" style={{ justifyContent: 'center' }}>
                  <button
                    className="btn-primary"
                    onClick={handleNotificationConfirm}
                    type="button"
                    style={{ width: 'auto', padding: '10px 40px' }}
                  >
                    {waitingScreenTexts.call_popup?.confirm}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* 混雑/完了通知ポップアップ (WaitingScreenContext で一元管理) */}
      {context.isPopupVisible && <CongestionPopup />}
    </div>
  );
}

export default WaitingScreen;
