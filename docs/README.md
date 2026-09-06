# docs — yoyaku_mate ドキュメントインデックス

## 構造

```
docs/
├── features/           # 機能仕様 (何をするのか)
├── implementation/     # 技術実装詳細 (どのように実装したのか)
├── decisions/          # 技術選定根拠 (ADR)
├── troubles/           # トラブルシューティング / 振り返り記録
└── refactoring/        # リファクタリング記録
```

---

## Features (機能仕様)

| ドキュメント | 説明 |
|------|------|
| [waiting-screen.md](./features/waiting-screen.md) | お客様用待機画面 (登録 → リアルタイム待機 → 完了/キャンセル) |
| [ai-chatbot.md](./features/ai-chatbot.md) | Gemini AI店舗案内チャットボット |

---

## Implementation (実装詳細)

| ドキュメント | 説明 |
|------|------|
| [architecture.md](./implementation/architecture.md) | プロジェクト構造およびデータフロー |
| [sse-client.md](./implementation/sse-client.md) | SSE購読クライアントの実装 |

---

## Decisions (技術決定)

| ドキュメント | 決定内容 |
|------|----------|
| [ADR-001-vercel-proxy.md](./decisions/ADR-001-vercel-proxy.md) | Vercel Rewriteプロキシ採用の理由 (廃止済み、ADR-002参照) |
| [ADR-002-remove-vercel-proxy.md](./decisions/ADR-002-remove-vercel-proxy.md) | Vercel Rewriteプロキシの廃止とREACT_APP_API_URLへの一本化 |

---

## Troubles (トラブルシューティング / 振り返り)

| ドキュメント | 説明 |
|------|------|
| [001-lessons-learned.md](./troubles/001-lessons-learned.md) | CORS、SSE再接続、AIプロンプト最適化の振り返り |
| [002-google-maps-api-loop.md](./troubles/002-google-maps-api-loop.md) | 3万画素の教訓: Google Maps API無限ループ障害と防御ロジック |
| [003-i18n-partial-breakage.md](./troubles/003-i18n-partial-breakage.md) | 多言語対応が一部無効化されていた問題 (国籍マッピング表、未接続の翻訳ファイル、キー欠落、ハードコーディング) |

---

## Refactoring (リファクタリング)

| ドキュメント | 説明 |
|------|------|
| [001-css-modules-migration.md](./refactoring/001-css-modules-migration.md) | CSS Modulesへのスタイルシステムmigration (グローバルCSS → CSS Modules + 共通デザインシステム) |
