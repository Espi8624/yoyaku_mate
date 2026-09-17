import { useState, useEffect, useRef, useCallback } from "react";
import { debugLog } from "../../../../utils/debugLog";

/**
 * 呼び出しチャイムと AudioContext のアンロックを担当するフック。
 *
 * ブラウザは自動再生を禁止しているため、呼び出しが発生してから音を鳴らそうとしても
 * 「ユーザー操作起因ではない」と見なされてブロックされる。
 * そのため、呼び出し前にユーザーのタップで AudioContext を起こしておくのが本質的な対策となる。
 * ・本命の経路: 「音を有効化」バナー (enableSound)
 * ・保険の経路: 画面のどこかを最初にタップした時点でのアンロック
 *
 * @returns {{
 *   soundEnabled: boolean,   - バナーを「有効化済み」表示にしてよいか
 *   enableSound: () => void, - 「音を有効化」ボタンのハンドラ
 *   startChime: () => void,  - チャイムを鳴らし、以降3秒ごとに繰り返す
 *   stopChime: () => void,   - チャイムの繰り返しを停止する
 * }}
 */
function useCallChime() {
  const audioCtxRef = useRef(null);
  const chimeIntervalRef = useRef(null);

  // ★ 「音を有効化」ボタンをユーザーが押したかどうか (UIバナー表示制御用)
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

  // チャイム音を1回再生する関数
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

  const stopChime = useCallback(() => {
    if (chimeIntervalRef.current) {
      clearInterval(chimeIntervalRef.current);
      chimeIntervalRef.current = null;
    }
  }, []);

  // 初回再生し、以降3秒ごとに繰り返す
  const startChime = useCallback(() => {
    playLoopChime();
    stopChime();
    chimeIntervalRef.current = setInterval(playLoopChime, 3000);
  }, [playLoopChime, stopChime]);

  // 「音を有効化」ボタン押下時のハンドラ (ユーザー操作イベント内で同期的にアンロックする)
  // ★ Safari対策: resume()のPromiseが解決する前にUIを「有効化済み」にしてしまうと、
  // 実際にはcontextがsuspendedのまま残るケースがあり(その後の非同期な呼び出し通知時には
  // ユーザー操作起因と見なされずresumeがブロックされる)、ユーザーには成功したように見えて
  // 本番の呼び出し音が鳴らないという不具合になっていた。
  // resumeの完了を待ってから確認音を鳴らし、soundEnabledをtrueにする。
  const enableSound = useCallback(() => {
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
  }, [getOrCreateAudioContext, playOneChime]);

  // -------------------------------------------------------
  // ★ Audio Context Unlock (バックアップ経路: ページ内のどこかを最初にタップした時点で初期化)
  // 「音を有効化」バナーのボタン(enableSound)が本命のアンロック経路だが、
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

  // アンマウント時にチャイムの繰り返しを止める
  useEffect(() => stopChime, [stopChime]);

  return { soundEnabled, enableSound, startChime, stopChime };
}

export default useCallChime;
