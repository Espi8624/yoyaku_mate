import React, { useState, useEffect, useRef } from "react";
import { useWaitingScreen } from "../WaitingScreenContext";
import useTranslation from "../../../hook/useTranslation";
import { getStoreInfo } from "../../../api/waitingService";
import MenuDisplay from "./MenuDisplay";
import CongestionPopup from "../waiting-screen-preview/CongestionPopup";
import { getTranslatedText } from "../../../utils/i18nHelper";
import ChatbotButton from "../../chat-bot/ChatbotButton";
import MapButton from '../map/MapButton';
import useWaitingStatus from "./useWaitingStatus";
import "./WaitingScreen.css";

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

  // ローカルストレージからstoreId, waitingIdを復元し、復元完了を通知するフラグ
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
  } = context;

  const t = useTranslation(selectedLanguageCode);
  const waitingScreenTexts = t.waiting_screen;

  // 店舗情報 (初回のみ取得)
  const [storeInfo, setStoreInfo] = useState(null);
  useEffect(() => {
    if (!storeId || !restored) return;
    getStoreInfo(storeId)
      .then(info => setStoreInfo(info || null))
      .catch(err => console.error("店舗情報の取得に失敗:", err));
  }, [storeId, restored]);

  // -------------------------------------------------------
  // ★ カスタムフックでポーリング (責務分離)
  // restored=true になってからポーリングを開始する
  // -------------------------------------------------------
  const { details: waitingDetails, menuList, status, error } = useWaitingStatus(
    storeId,
    waitingId,
    restored  // 復元完了後にポーリング開始
  );

  // -------------------------------------------------------
  // ★ 通知状態管理 (enum パターン)
  // status が 'notified' に変わったタイミングで once だけ通知を起動する
  // -------------------------------------------------------
  const [notificationState, setNotificationState] = useState(NOTIFICATION_STATE.IDLE);
  const chimeIntervalRef = useRef(null);

  // Audio Unlock ref (ユーザーのタップでAudioContextを初期化・再開する)
  const audioCtxRef = useRef(null);

  // status 変化を監視して通知を制御
  useEffect(() => {
    if (status === 'notified' && notificationState === NOTIFICATION_STATE.IDLE) {
      // --- 初めて notified を検知: モーダルを表示し通知を開始 ---
      setNotificationState(NOTIFICATION_STATE.SHOWING);

      // 1. バイブレーション (Android のみ, 初回のみ)
      try {
        if (navigator.vibrate) navigator.vibrate([1000, 500, 1000, 500, 3000]);
      } catch (e) { /* バイブレーション非対応端末は無視 */ }

      // 2. チャイム音をループ再生する関数
      const playLoopChime = () => {
        try {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (!AudioContextClass) return;

          // Audio Unlock 済みの Context を優先使用
          let ctx = audioCtxRef.current;
          if (!ctx) ctx = new AudioContextClass();

          // ブラウザの自動再生ポリシーで Suspended になっている場合は再開を試みる
          if (ctx.state === 'suspended') {
            ctx.resume().catch(e => console.warn("AudioContext resume失敗:", e));
          }

          // 「ピン」を2回鳴らして「ピンポン」のような音を作る
          const playOneChime = (startTime) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, startTime);        // A5
            osc.frequency.exponentialRampToValueAtTime(440, startTime + 0.6); // A4へ下降

            gain.gain.setValueAtTime(0.3, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);

            osc.start(startTime);
            osc.stop(startTime + 0.6);
          };

          const now = ctx.currentTime;
          playOneChime(now);
          playOneChime(now + 0.8);
        } catch (e) {
          console.error("チャイム再生エラー:", e);
        }
      };

      // 初回再生し、以降3秒ごとに繰り返す
      playLoopChime();
      if (chimeIntervalRef.current) clearInterval(chimeIntervalRef.current);
      chimeIntervalRef.current = setInterval(playLoopChime, 3000);

    } else if (status === 'cancelled' && context.cancellationReason === null) {
      // キャンセルステータスの対応 (Context 経由で CancelledScreen へ)
      context.setCancellationReason && context.setCancellationReason('store');
    } else if (status === 'absence' && context.cancellationReason === null) {
      // 無断キャンセルステータスの対応
      context.setCancellationReason && context.setCancellationReason('absence');
    }
  }, [status, notificationState, context]);

  // 404エラー時は CancelledScreen に遷移
  useEffect(() => {
    if (error === '__NOT_FOUND__') {
      context.setCancellationReason && context.setCancellationReason('store');
    }
  }, [error, context]);

  // コンポーネントのアンマウント時にチャイムを停止
  useEffect(() => {
    return () => {
      if (chimeIntervalRef.current) clearInterval(chimeIntervalRef.current);
    };
  }, []);

  // -------------------------------------------------------
  // ★ Audio Context Unlock (ユーザーの最初のタップで初期化)
  // -------------------------------------------------------
  useEffect(() => {
    const unlockAudio = () => {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          audioCtxRef.current = new AudioContextClass();
        }
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().then(() => {
          console.log("AudioContext: ユーザー操作により再開しました");
        });
      }
      // 一度アンロックしたらリスナーを削除
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };

    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);

    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    };
  }, []);

  // -------------------------------------------------------
  // ★ Screen Wake Lock (画面を常時ON に保つ)
  // -------------------------------------------------------
  useEffect(() => {
    let wakeLock = null;

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
          console.log('Wake Lock: 有効化しました');
        }
      } catch (err) {
        console.error(`Wake Lock 取得失敗: ${err.name}, ${err.message}`);
      }
    };

    requestWakeLock();

    // タブが非表示になった後に可視状態へ戻ったときに再取得する
    const handleVisibilityChange = async () => {
      if (wakeLock !== null && document.visibilityState === 'visible') {
        await requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLock !== null) {
        wakeLock.release()
          .then(() => console.log('Wake Lock: 解放しました'))
          .catch(err => console.error('Wake Lock 解放エラー:', err));
      }
    };
  }, []);

  // UI 用の派生値
  const [showCancelPopup, setShowCancelPopup] = useState(false);
  const isNotificationShowing = notificationState === NOTIFICATION_STATE.SHOWING;

  // -------------------------------------------------------
  // 確認ボタン押下時: チャイムを止め、通知状態を「確認済み」にする
  // -------------------------------------------------------
  const handleNotificationConfirm = () => {
    if (chimeIntervalRef.current) clearInterval(chimeIntervalRef.current);
    setNotificationState(NOTIFICATION_STATE.ACCEPTED);
  };

  return (
    <div className="waiting-section">
      <ChatbotButton />
      <MapButton />

      {/* 店名を表示 */}
      {storeInfo && storeInfo.store_name && (
        <div className="store-name-header">
          <h2>{storeInfo.store_name}</h2>
        </div>
      )}

      <div className="preview-label">{waitingScreenTexts.label_1}</div>
      {waitingScreenTexts.label_2 && (
        <div className="waiting-label-2">{waitingScreenTexts.label_2}</div>
      )}

      {error && error !== '__NOT_FOUND__' ? (
        <div className="waiting-section">{error}</div>
      ) : (
        <>
          <form className="preview-form">
            <div className="preview-info-group">
              <div className="waiting-number-label">{waitingScreenTexts.waiting_number_label}</div>
              <div className="waiting-number-value">
                {waitingDetails.queue_number || '-'}
              </div>
            </div>

            <div className="preview-info-group">
              <label className="preview-item-label">{waitingScreenTexts.party_size_label}</label>
              <div className="preview-item-value">{waitingDetails.party_size || '-'}</div>
            </div>

            <div className="preview-info-group">
              <label className="preview-item-label">{waitingScreenTexts.note_label}</label>
              <div className="preview-item-value">{waitingDetails.notes || '-'}</div>
            </div>

            <div className="preview-info-group">
              <label className="preview-item-label">{waitingScreenTexts.current_waiting_label}</label>
              <div className="preview-item-value">{Math.max(0, waitingDetails.waiting_count - 1)}{waitingScreenTexts.group_label}</div>
            </div>

            <div className="preview-info-group">
              <label className="preview-item-label">
                {waitingScreenTexts.registration_time_label}
              </label>
              <div className="preview-item-value">
                {waitingDetails.registration_time ? (() => {
                  const date = new Date(waitingDetails.registration_time);
                  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                })() : '-'}
              </div>
            </div>

            <div className="preview-info-group">
              <label className="preview-item-label">{waitingScreenTexts.estimated_wait_time_label}</label>
              <div className="preview-item-value">{waitingDetails.estimated_waiting_time || "-"}</div>
            </div>
          </form>

          {/* 事前注文済みメニューの表示 */}
          {waitingDetails.menu_items && waitingDetails.menu_items.length > 0 && (
            <div className="menu-container" style={{ marginBottom: '24px' }}>
              <div className="preview-label" style={{ fontSize: '1.1em', marginBottom: '12px' }}>{waitingScreenTexts.pre_order}</div>
              <div className="preview-menu-list">
                {waitingDetails.menu_items.map((item, index) => {
                  const fullMenu = menuList.find(m => m.menu_id === item.menu_id);
                  const imageUrl = fullMenu ? fullMenu.menu_image_url : null;

                  let displayName = item.name;
                  if (fullMenu && fullMenu.title_translations) {
                    displayName = getTranslatedText(item.name, fullMenu.title_translations, selectedLanguageCode);
                  }

                  return (
                    <div key={index} className="preview-menu-item">
                      {imageUrl ? (
                        <img src={imageUrl} alt={displayName} className="preview-menu-image" />
                      ) : (
                        <div className="preview-menu-placeholder">No Image</div>
                      )}
                      <div className="preview-menu-info">
                        <div className="preview-menu-header">
                          <span className="preview-menu-name">{displayName}</span>
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

          {/* キャンセル確認ポップアップ */}
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
                    onClick={async () => {
                      setShowCancelPopup(false);
                      await handleCancel();
                    }}
                    type="button"
                  >
                    {waitingScreenTexts.cancel_popup.confirm}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ★ 呼び出し通知モーダル
              notificationState === 'showing' の間だけ表示される。
              「確認」ボタンを押すと 'accepted' に遷移し、以降は再表示されない。 */}
          {isNotificationShowing && (
            <div className="congestion-popup-overlay">
              <div className="congestion-popup-modal" style={{ textAlign: 'center', padding: '30px' }}>
                <div className="congestion-popup-message" style={{ fontSize: '1.2em', fontWeight: 'bold', marginBottom: '20px' }}>
                  {waitingScreenTexts.call_popup?.message_1}<br />
                  {waitingScreenTexts.call_popup?.message_2}
                </div>
                <div className="congestion-popup-actions" style={{ justifyContent: 'center' }}>
                  <button
                    className="confirmation-btn"
                    onClick={handleNotificationConfirm}
                    type="button"
                    style={{ minWidth: '150px' }}
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
