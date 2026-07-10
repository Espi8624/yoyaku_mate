# SSE クライアント実装

> 最終更新: 2026-07-10  
> 関連ファイル: [`src/api/waitingService.js`](../../src/api/waitingService.js)

## 概要

ブラウザ標準の `EventSource` APIを使用して、サーバーのSSEストリームを購読します。  
ライブラリに依存せず、標準Web APIのみで実装しています。

---

## 購読チャネル (2種類)

| 関数 | エンドポイント | 用途 |
|------|-----------|--------|
| `subscribeToWaitingList` | `/waiting-list/stream?store_id=` | 状況板 (Board) |
| `subscribeToWaitingStatus` | `/waiting-list/stream-user?store_id=&waiting_id=` | 個別待機画面 |

---

## 実装コード

```javascript
// src/api/waitingService.js

export const subscribeToWaitingStatus = (storeId, waitingId, onMessage, onError) => {
  const url = `${API_BASE_URL}/waiting-list/stream-user?store_id=${storeId}&waiting_id=${waitingId}`;
  const eventSource = new EventSource(url);

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (e) {
      console.error('[SSE User] JSON parse error:', e);
    }
  };

  eventSource.onerror = (error) => {
    console.warn('[SSE User] Connection error:', error);
    if (onError) onError(error);
  };

  return eventSource;  // 呼び出し側で .close() を実行してクリーンアップ
};
```

---

## 接続のクリーンアップ (Cleanup)

コンポーネントのアンマウント時には、返却された `EventSource` インスタンスに対して必ず `.close()` を呼び出し、リソースを解放します.

```javascript
// Reactコンポーネント内での使用例
useEffect(() => {
  const es = subscribeToWaitingStatus(storeId, waitingId, onMessage, onError);
  return () => es.close();  // cleanup
}, [storeId, waitingId]);
```

---

## 自動再接続

`EventSource` は接続が切断された場合、ブラウザが **自動的に再接続** を試みます。  
特別な再接続処理ロジックを実装することなく、オフラインから復帰した際にも自動的に復旧します。

再接続時、サーバーは接続直後に最新のデータを初期値として送信するため、データ欠損のない同期が可能です。

---

## 関連ドキュメント

- [お客様用待機画面](../features/waiting-screen.md)
- [サーバー側SSE実装](../../../yoyaku_mate_server/docs/implementation/sse.md)
