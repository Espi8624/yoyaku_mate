import React, { useState, useEffect, useRef, useCallback } from "react";
import { useWaitingScreen } from "../WaitingScreenContext";
import useTranslation from "../../../hook/useTranslation";
import { getStoreInfo } from "../../../api/waitingService";
import MenuDisplay from "./MenuDisplay";
import CongestionPopup from "../waiting-screen-preview/CongestionPopup";
import { getTranslatedText } from "../../../utils/i18nHelper";
import { debugLog } from "../../../utils/debugLog";
import { MAP_CHATBOT_ENABLED } from "../../../constants/featureFlags";
import ChatbotButton from "../../chat-bot/ChatbotButton";
import MapButton from '../map/MapButton';
import useWaitingStatus from "./useWaitingStatus";
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

  // ★ 「音を有効化」ボタンをユーザーが押したかどうか (UIバナー表示制御用)
  // ボタン押下時のクリックイベント内で同期的に AudioContext を生成・resumeするため、
  // iOS Safari 含むほとんどのブラウザで確実にアンロックできる (呼び出し発生時の非同期resumeは
  // ユーザー操作起因と見なされずブロックされることが多いため、事前アンロックが本命の対策)
  const [soundEnabled, setSoundEnabled] = useState(false);

  // 既存の AudioContext を再利用し、無ければ新規生成する共通処理
  const getOrCreateAudioContext = useCallback(() => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContextClass();
    }
    return audioCtxRef.current;
  }, []);

  // 「ピン」を1回鳴らす (チャイム・テスト音で共通利用)
  const playOneChime = useCallback((ctx, startTime) => {
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
  }, []);

  // 実際にチャイムを鳴らす処理本体 (resumeが完了して running になった後に呼ぶ前提)
  const playLoopChimeNow = useCallback((ctx) => {
    const now = ctx.currentTime;
    playOneChime(ctx, now);
    playOneChime(ctx, now + 0.8);
  }, [playOneChime]);

  // チャイム音をループ再生する関数
  // ★ Safari対策: resume()の完了(Promise解決)を待たずに再生予約すると、
  // resumeが完了する前にscheduleされた音がSafariでは鳴らないことがあるため、
  // 必ずPromiseの解決を待ってから再生する (Chromeは元々寛容だが同じ経路で統一する)
  const playLoopChime = useCallback(() => {
    try {
      const ctx = getOrCreateAudioContext();
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx.resume()
          .then(() => playLoopChimeNow(ctx))
          .catch(e => console.warn("AudioContext resume失敗 (チャイム):", e));
      } else {
        playLoopChimeNow(ctx);
      }
    } catch (e) {
      console.error("チャイム再生エラー:", e);
    }
  }, [getOrCreateAudioContext, playLoopChimeNow]);

  // 「音を有効化」ボタン押下時のハンドラ (ユーザー操作イベント内で同期的にアンロックする)
  // ★ Safari対策: resume()のPromiseが解決する前にUIを「有効化済み」にしてしまうと、
  // 実際にはcontextがsuspendedのまま残るケースがあり(その後の非同期な呼び出し通知時には
  // ユーザー操作起因と見なされずresumeがブロックされる)、ユーザーには成功したように見えて
  // 本番の呼び出し音が鳴らないという不具合になっていた。
  // resumeの完了を待ってから確認音を鳴らし、soundEnabledをtrueにする。
  const handleEnableSound = () => {
    try {
      const ctx = getOrCreateAudioContext();
      if (!ctx) {
        // Web Audio 非対応端末: バナーだけ消し、バイブレーション等の他手段に任せる
        setSoundEnabled(true);
        return;
      }

      const confirmEnabled = () => {
        // 確認用に短いテスト音を1回鳴らす
        playOneChime(ctx, ctx.currentTime);
        setSoundEnabled(true);
      };

      if (ctx.state === 'suspended') {
        ctx.resume()
          .then(confirmEnabled)
          .catch(e => {
            // resumeに失敗した場合はバナーを「有効化済み」にしない → ユーザーが再タップできる
            console.error("サウンド有効化エラー (resume失敗):", e);
          });
      } else {
        confirmEnabled();
      }
    } catch (e) {
      console.error("サウンド有効化エラー:", e);
    }
  };

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
      playLoopChime();
      if (chimeIntervalRef.current) clearInterval(chimeIntervalRef.current);
      chimeIntervalRef.current = setInterval(playLoopChime, 3000);

    } else if (status === 'cancelled' && context.cancellationReason === null) {
      // 呼び出し済み（notificationState !== IDLE）の状態でキャンセルされた場合は不在扱い
      const isAbsence = notificationState !== NOTIFICATION_STATE.IDLE;
      context.setCancellationReason && context.setCancellationReason(isAbsence ? 'absence' : 'store');
    } else if (status === 'no_show' && context.cancellationReason === null) {
      // サーバー側のno_showステータスも不在扱い
      context.setCancellationReason && context.setCancellationReason('absence');
    }
  }, [status, notificationState, context, playLoopChime]);

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
  // ★ Audio Context Unlock (バックアップ経路: ページ内のどこかを最初にタップした時点で初期化)
  // 「音を有効化」バナーのボタン(handleEnableSound)が本命のアンロック経路だが、
  // バナーを押さずに他の場所(メニュー確認やキャンセルボタン等)を先に触った場合でも
  // 救済できるよう、汎用のタップ検知も併用しておく
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
          debugLog("AudioContext: ユーザー操作により再開しました");
        });
      }
      setSoundEnabled(true);
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
  // ★ タブがバックグラウンドから復帰した際に AudioContext の再開を試みる (ベストエフォート)
  // 端末の画面ロックやタブ切り替えで AudioContext が自動的に suspended になることがあるため、
  // 復帰時に再試行する。ユーザー操作起因のイベントではないため成功しないブラウザ(iOS Safari等)も
  // あるが、失敗しても実害はない
  // -------------------------------------------------------
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => { /* ユーザー操作起因ではないため失敗しても無視 */ });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
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
          debugLog('Wake Lock: 有効化しました');
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
          .then(() => debugLog('Wake Lock: 解放しました'))
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
              onClick={handleEnableSound}
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

          <MenuDisplay menuList={menuList} texts={waitingScreenTexts} selectedLanguageCode={selectedLanguageCode} />

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
