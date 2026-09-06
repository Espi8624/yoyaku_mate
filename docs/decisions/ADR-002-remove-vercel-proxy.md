# ADR-002: Vercel Rewriteプロキシの廃止

> 作成日: 2026-09-06  
> ステータス: 確定

## コンテキスト

[ADR-001](./ADR-001-vercel-proxy.md) では、CORS回避とバックエンドURLの隠蔽のために Vercel Rewrite (`vercel.json` の `/api/*` 転送) を採用していた。

しかし、開発/テスト用のデプロイ先として Cloudflare (Workers Static Assets) を追加検討したところ、以下の問題が判明した。

- `API_BASE_URL` の分岐が `process.env.NODE_ENV === 'production'` で行われていたが、これは「Vercelにデプロイされているか」ではなく「`npm run build` で本番ビルドされたか」を表すフラグに過ぎない。そのため Vercel 以外のプラットフォームへビルド・デプロイした場合も同じ分岐に入り、存在しない `/api` 相対パスへリクエストしてしまい通信が失敗する。
- ADR-001 のトレードオフ欄で既に「デプロイプラットフォーム変更時はプロキシ設定の再作成が必要」と指摘されていた通り、Vercel固有の仕組みに依存する設計は複数プラットフォームでの運用(本番: Vercel、開発: Cloudflare)と相性が悪い。

---

## 決定: Vercel Rewriteプロキシを廃止し、`REACT_APP_API_URL` に一本化

`NODE_ENV` による分岐をやめ、デプロイ先プラットフォームに関わらず環境変数 `REACT_APP_API_URL` で実際のバックエンドURLを直接指定する方式に統一した。

```javascript
// 変更前
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? "/api"
  : (process.env.REACT_APP_API_URL || "http://localhost:8080/api");

// 変更後
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080/api";
```

これに伴い、`vercel.json.example` および `.gitignore` の `vercel.json` 関連エントリも削除した。

### 理由

1. **プラットフォーム非依存**: どのホスティング先(Vercel / Cloudflare Pages, Workers / その他静的ホスティング)でも同じビルド成果物がそのまま動作する。
2. **設定の単純化**: プラットフォーム側でのRewrite/プロキシ設定が不要になり、環境変数の設定のみで完結する。
3. **バックエンドのCORS設定は元々必要**: `yoyaku_mate_server` は `AllowOrigins` でオリジンを許可制御しており、プロキシを挟まなくても安全にCORS運用できる。

### トレードオフ (許容可能)

- バックエンドの実URLがクライアントバンドルに含まれる (これはADR-001時点でも `REACT_APP_API_URL` を使うローカル開発では同様だった)
- SSE接続もブラウザから直接 fly.io へ張るため、Vercel Edge経由に比べてレイテンシがわずかに改善する可能性がある

---

## 関連ドキュメント

- [ADR-001: Vercel Rewriteプロキシの採用 (廃止済み)](./ADR-001-vercel-proxy.md)
- [アーキテクチャの概要](../implementation/architecture.md)
