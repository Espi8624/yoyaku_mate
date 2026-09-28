/**
 * 開発環境でのみコンソール出力するデバッグログ用ヘルパー
 * (本番/リモート環境でユーザーのブラウザコンソールに内部情報が
 * そのまま表示され続けるのを防ぐ)
 *
 * console.error / console.warn は実際の異常検知に使うため対象外 —
 * ここで抑制するのは動作確認用のconsole.logのみ。
 */
export const debugLog = (...args) => {
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
};
