# ADR-001: Vercel Rewriteプロキシの採用

> 作成日: 2026-07-10  
> ステータス: 確定

## コンテキスト

Reactウェブクライアント(Vercel)からGoバックエンドサーバー(fly.io)へAPIリクエストを送信する際、双方のドメインが異なるためCORS問題が発生します。これを解決する方法を検討しました。

---

## 検討対象

| 方法 | 説明 | 課題 |
|------|------|--------|
| バックエンドでCORS許可 | `Access-Control-Allow-Origin: *` 設定 | APIエンドポイントURLの露出 |
| 独自のプロキシサーバー | Nginx等の中間サーバーの運用 | インフラの複雑性の増加 |
| **Vercel Rewrite** | `vercel.json` で `/api/*` → バックエンドURLへ転送 | 追加インフラ不要 |

---

## 決定: Vercel Rewriteプロキシの採用

### 理由

1. **バックエンドURLの隠蔽**: クライアントコード上で実際のバックエンドサーバーのIPやURLが露出するのを防ぎます。

2. **追加インフラ不要**: `vercel.json` に数行の設定を追加するだけで実現でき、プロキシサーバーを独自に管理・運用するコストが発生しません。

3. **環境分離の容易性**: ローカル開発では `REACT_APP_API_URL` を使用して直接呼び出し、本番環境では `/api` という統一されたパスを使用できます。

```javascript
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? "/api"                          // Vercel Proxy 経由
  : process.env.REACT_APP_API_URL;  // ローカル直接呼び出し
```

### トレードオフ (許容可能)

- Vercelプラットフォームへの依存。配備プラットフォーム変更時はプロキシ設定の再作成が必要。
- SSE(Server-Sent Events)接続もVercel Edgeを経由するため、遅延がわずかに増加する可能性があります。

---

## 関連ドキュメント

- [アーキテクチャの概要](../implementation/architecture.md)
