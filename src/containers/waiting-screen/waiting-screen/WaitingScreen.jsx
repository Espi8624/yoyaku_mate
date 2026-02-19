import React, { useState, useEffect, useRef, useCallback } from "react";
import { useWaitingScreen } from "../WaitingScreenContext";
import useTranslation from "../../../hook/useTranslation";
import { getMenuList, getWaitingDetails, getStoreInfo } from "../../../api/waitingService";
import MenuDisplay from "./MenuDisplay";
import CongestionPopup from "../waiting-screen-preview/CongestionPopup"; // Import Popup
import { getTranslatedText } from "../../../utils/i18nHelper";
import ChatbotButton from "../../chat-bot/ChatbotButton";
import MapButton from '../map/MapButton'; // Modified
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
  } = context;

  const t = useTranslation(selectedLanguageCode);
  const waitingScreenTexts = t.waiting_screen;

  // ステータス管理
  const [error, setError] = useState(null);
  const [waitingDetails, setWaitingDetails] = useState({});
  const [menuList, setMenuList] = useState([]);
  const [storeInfo, setStoreInfo] = useState(null);
  const [showCancelPopup, setShowCancelPopup] = useState(false);
  // ★ 呼び出し通知モーダル用
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const chimeIntervalRef = useRef(null);

  // ポーリング用のref
  const pollingRef = useRef(null);

  // 店舗情報を初回のみ取得
  useEffect(() => {
    if (!storeId || !restored) return;

    const fetchStoreInfo = async () => {
      try {
        const info = await getStoreInfo(storeId);
        setStoreInfo(info || null);
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



    try {
      const [details, menu] = await Promise.all([
        getWaitingDetails(storeId, waitingId),
        getMenuList(storeId)
      ]);



      const safeDetails = details || {};

      // ★ 取得したデータのwaiting_idが一致しない場合はエラー
      if (safeDetails.waiting_id && String(safeDetails.waiting_id) !== String(waitingId)) {
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

      // ★ completedステータス (入店完了)
      if (safeDetails.status === "completed") {
        // ユーザーが「入店完了」の状態を確認できるように、画面遷移を行わず、
        // 完了状態であることを内部的に保持するか、単に詳細を更新する。
        // ここで setCancellationReason を呼ぶと CancelledScreen (完了画面) に遷移してしまうため、
        // 呼ばないように変更。
        // if (!context.cancellationReason) {
        //   context.setCancellationReason && context.setCancellationReason('completed');
        // }
        // return;

        // そのまま下の setWaitingDetails へ進む
      }

      // ★ notifiedステータスをチェックしてstep 4に遷移せずにモーダルを表示
      if (safeDetails.status === "notified") {
        if (pollingRef.current) clearInterval(pollingRef.current);

        // 既にモーダルが出ている場合は再実行しない
        if (!showNotificationModal) {
          setShowNotificationModal(true);

          // 1. バイブレーション (Loopしない: 初回のみ)
          try {
            if (navigator.vibrate) navigator.vibrate([1000, 500, 1000, 500, 3000]);
          } catch (e) { }

          // 2. 音声通知 (Loop再生)
          const playLoopChime = () => {
            try {
              const AudioContext = window.AudioContext || window.webkitAudioContext;
              if (!AudioContext) return;

              let ctx = audioCtxRef.current;
              if (!ctx) ctx = new AudioContext();

              if (ctx.state === 'suspended') {
                ctx.resume().catch(e => console.error("Auto-resume failed:", e));
              }

              const playOneChime = (startTime) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, startTime);
                osc.frequency.exponentialRampToValueAtTime(440, startTime + 0.6);

                gain.gain.setValueAtTime(0.3, startTime);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);

                osc.start(startTime);
                osc.stop(startTime + 0.6);
              };

              const now = ctx.currentTime;
              playOneChime(now);
              playOneChime(now + 0.8);
            } catch (e) { console.error("Chime failed", e); }
          };

          playLoopChime();

          if (chimeIntervalRef.current) clearInterval(chimeIntervalRef.current);
          chimeIntervalRef.current = setInterval(playLoopChime, 3000);
        }
        return;
      }

      if (safeDetails.status === "waiting" && showNotificationModal) {
        setShowNotificationModal(false);
        if (chimeIntervalRef.current) clearInterval(chimeIntervalRef.current);
      }

      setWaitingDetails(safeDetails);
      if (menu && menu.length > 0) {
        console.log("[Debug] Menu Item 0:", menu[0]);
        console.log("[Debug] Title Translations:", menu[0].title_translations);
        console.log("[Debug] Selected Language:", selectedLanguageCode);
      }
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
      // Cleanup if needed
    }
  }, [storeId, waitingId, context, selectedLanguageCode, showNotificationModal]);

  useEffect(() => {
    if (!restored) return;
    let isMounted = true;
    setError(null);

    loadAllData();

    pollingRef.current = setInterval(() => {
      if (isMounted) {
        loadAllData();
      }
    }, 3000);

    return () => {
      isMounted = false;
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [loadAllData, restored]);

  // ★ Audio Context (Unlock logic)
  const audioCtxRef = useRef(null);

  useEffect(() => {
    // ユーザーインタラクションでAudioContextを再開/初期化する関数
    const unlockAudio = () => {
      if (!audioCtxRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          audioCtxRef.current = new AudioContext();
        }
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().then(() => {
          console.log("AudioContext resumed");
        });
      }
      // イベントリスナーを削除 (一度だけでOK)
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };

    // 画面のどこかをタップしたらUnlock
    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);

    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  // ★ Wake Lock (画面常時ON) 機能
  useEffect(() => {
    let wakeLock = null;

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
          console.log('Wake Lock is active');
        }
      } catch (err) {
        console.error(`Wake Lock failed: ${err.name}, ${err.message}`);
      }
    };

    // コンポーネントマウント時にリクエスト
    requestWakeLock();

    // 画面表示状態が変わった時の再取得ロジック
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
          .then(() => console.log('Wake Lock released'))
          .catch(err => console.error('Wake Lock release failed:', err));
      }
    };
  }, []);

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
      {error ? (
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

          {/* Display selected menu items if any */}
          {waitingDetails.menu_items && waitingDetails.menu_items.length > 0 && (
            <div className="menu-container" style={{ marginBottom: '24px' }}>
              <div className="preview-label" style={{ fontSize: '1.1em', marginBottom: '12px' }}>{waitingScreenTexts.pre_order}</div>
              <div className="preview-menu-list">
                {waitingDetails.menu_items.map((item, index) => {
                  // Find the full menu object to get the image URL and translations
                  const fullMenu = menuList.find(m => m.menu_id === item.menu_id);
                  const imageUrl = fullMenu ? fullMenu.menu_image_url : null;

                  // 翻訳テキスト取得
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



          {/* Google Maps Integration */}
          {/* WaitingPlaceMap component removed as per instruction */}

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

          {/* ★ 呼び出し通知モーダル (Loop Sound Control) */}
          {showNotificationModal && (
            <div className="congestion-popup-overlay">
              <div className="congestion-popup-modal" style={{ textAlign: 'center', padding: '30px' }}>
                <div className="congestion-popup-message" style={{ fontSize: '1.2em', fontWeight: 'bold', marginBottom: '20px' }}>
                  {/* 多国語対応: call_popup キーを使用 */}
                  {waitingScreenTexts.call_popup?.message_1}<br />
                  {waitingScreenTexts.call_popup?.message_2}
                </div>
                <div className="congestion-popup-actions" style={{ justifyContent: 'center' }}>
                  <button
                    className="confirmation-btn"
                    onClick={() => {
                      if (chimeIntervalRef.current) clearInterval(chimeIntervalRef.current);
                      setShowNotificationModal(false);
                      // モーダルを閉じたら NotifiedScreen (Step 4) へ遷移する場合もあるが、
                      // 要件「画面移動しない」に従い、そのままにするか、
                      // もしくは「確認」＝「来店確認」としてStep4へ飛ばすか。
                      // 今回の要件は「画面移動せずモ달」なので、閉じたらそのまま今の画面にいる、が正しいと判断。
                      // ただし、バックグラウンドでPollingが止まっているので、
                      // リロードしないと次のステータス(completed)に行けないかも。
                      // なので、閉じたらStep 4に遷移するのが自然だが...
                      // ユーザー要望: "호출 스테이터스일때 원래 화면 이동이었잖아. 근데 화면 이동 하지않고..."
                      // 画面移動せずにモ달だけ閉じる。
                    }}
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

      {/* 混雑/完了通知ポップアップ (WaitinScreenContextで管理) */}
      {context.isPopupVisible && <CongestionPopup />}

    </div>
  );
}

export default WaitingScreen;
