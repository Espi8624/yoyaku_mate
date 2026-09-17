import { useEffect } from "react";
import { debugLog } from "../../../../utils/debugLog";

/**
 * 画面を常時ONに保つフック (Screen Wake Lock API)。
 *
 * 待機中の客が画面を見たまま放置しても消灯しないようにする。
 * ・非対応ブラウザでは何もしない (失敗しても実害はないため握りつぶす)
 * ・タブが非表示になるとロックは自動解放されるため、可視化時に取り直す
 */
function useScreenWakeLock() {
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
}

export default useScreenWakeLock;
