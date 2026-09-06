# アーキテクチャの概要

> 最終更新: 2026-09-06

## Tech Stack

| 項目 | 技術 |
|------|------|
| Framework | React 19 |
| Router | React Router DOM 7 |
| HTTP | Axios |
| リアルタイムストリーム | EventSource (SSE) |
| マップ | Google Maps API (`@react-google-maps/api`) |
| AI | Gemini API |
| i18n | 自主実装 (ja/en/ko/fr/de/ru/vi/th/zh/id/ar/es/it/pt) |
| デプロイ | Vercel (本番) / Cloudflare Workers Static Assets (開発) |

---

## ディレクトリ構造

```
src/
├── api/
│   └── waitingService.js     # すべてのAPI呼び出しの定義 (Axios + EventSource)
│
├── containers/               # 画面単位のビジネスロジック
│   ├── waiting-screen/       # お客様待機の全体フロー (Context + Flow)
│   │   ├── WaitingScreenContext.jsx   # グローバル状態管理
│   │   ├── WaitingScreenFlow.jsx      # ステップ別画面レンダリング
│   │   ├── waiting-screen-input/     # 人数/国籍入力
│   │   ├── waiting-screen-menu/      # メニュー事前選択
│   │   ├── waiting-screen-preview/   # 待機状況プレビュー
│   │   ├── waiting-screen/           # リアルタイム待機画面
│   │   ├── waiting-screen-notified/  # 呼び出し通知画面
│   │   └── waiting-screen-cancelled/ # キャンセル完了画面
│   ├── board/                # リアルタイム待機状況板 (店舗表示用)
│   └── chat-bot/             # Gemini AI チャットボット
│
├── components/               # 共通再利用UIコンポーネント
├── hook/                     # Reactカスタムフック
├── i18n/                     # 多言語リソース (ja.json, ko.json など)
├── data/                     # 静的データ (nationalities.json)
├── styles/                   # グローバルスタイル
└── utils/                    # 共通ユーティリティ関数
```

---

## ネットワークフロー

```
ブラウザ
    │
    │  REACT_APP_API_URL宛の直接リクエスト (CORS)
    ▼
Backend Server (fly.io)
    │
    ├── REST レスポンス
    └── SSE ストリーム (Event Stream)
    
ブラウザ
    │
    │  AIプロンプト
    ▼
Gemini API (直接呼び出し)
```

---

## 状態管理方式

特定の状態管理ライブラリは使用せず、 **React Context API** を使用しています。

- `WaitingScreenContext`: 待機画面の全体フローの状態を管理
- 各画面コンポーネントは `useWaitingScreen()` フックを介してContextへアクセス

---

## 環境別のAPI URL

```javascript
// デプロイ先プラットフォームに関わらず、REACT_APP_API_URLで実際の
// バックエンドURLを直接指定する (Vercel Rewriteのような中継は使用しない)
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080/api";
```

---

## 関連ドキュメント

- [お客様用待機画面の機能仕様](../features/waiting-screen.md)
- [SSEクライアント実装](./sse-client.md)
- [Vercelプロキシ採用決定根拠 (廃止済み)](../decisions/ADR-001-vercel-proxy.md)
- [Vercelプロキシ廃止の経緯](../decisions/ADR-002-remove-vercel-proxy.md)
