# 💻 Yoyaku Mate - お客様待機画面（Web クライアント）

> **Yoyaku Mate** は、店舗の予約・順番待ちをリアルタイムで管理し、来店されたお客様が快適にお待ちいただけるよう支援するリアルタイム順番待ちシステムです。本リポジトリは、お客様がスマートフォン（モバイルWeb）を通じて待ち状況の確認、チャットボットや地図の利用ができる**お客様向けWebクライアント**プロジェクトです。

---

## 🛠 Tech Stack（技術スタック）

- **Frontend Core:** React 19、React Router DOM 7
- **HTTP Client:** Axios（API 非同期通信）
- **Maps API:** `@react-google-maps/api`（Google マップによる店舗位置情報の提供）
- **AI Chatbot:** Gemini API（待ち時間中に店舗情報・案内を担当する AI アシスタント）
- **Utility:** `qrcode.react`（お客様固有の QR コード生成）
- **Deployment & Proxy:** Vercel（Edge Middleware Rewrites を活用）

---

## ✨ Key Features（主要機能）

- **リアルタイム順番待ち状況確認：** 現在の待ち順番および予想待ち時間をリアルタイムで確認できます。
- **多言語対応（i18n）：** 日本語・韓国語・英語・中国語・タイ語・ベトナム語など、多言語に対応しグローバルなお客様への対応が可能です。
- **店舗情報・地図の提供：** Google マップ API を通じて店舗の正確な位置情報を確認し、ルート案内を利用できます。
- **AI 店舗ガイドチャットボット：** Gemini AI チャットボットが営業時間・お手洗いの場所・メニューのご提案など、待ち時間中のお客様のさまざまなご質問にお答えします。
- **モバイル QR チケット：** 現場のキオスクや順番待ちボードでそのまま確認できる、お客様専用の QR チケットを提供します。

---

## 📂 Project Structure（フォルダ構成）

```bash
src/
├── api/                  # API 通信の定義（Axios インターセプターおよび順番待ちサービス呼び出し）
├── components/           # 共通 UI コンポーネント
├── containers/           # ページ/コンテナ別のビジネスロジックおよび画面
│   ├── board/            # リアルタイム状況掲示板画面
│   ├── chat-bot/         # Gemini ベースの AI チャットボット画面
│   └── waiting-screen/   # お客様待機詳細画面（地図・メニュープレビュー・通知など）
├── data/                 # 静的データ（国籍データ等）
├── hook/                 # カスタム React フック
├── i18n/                 # 多言語翻訳リソースファイル（ko.json、ja.json 等）
├── styles/               # グローバルスタイルおよびテーマ定義
└── utils/                # ユーティリティ関数群
```

---

## 🚀 Getting Started（セットアップガイド）

### 1. 環境変数の設定

ローカル開発環境を構築するため、プロジェクトルートディレクトリに `.env.development` ファイルを作成します。  
*（API キーおよび機密情報は、デプロイ環境または非公開の開発環境変数としてローカルのみで管理します。）*

```env
# 開発環境 API サーバーアドレス
REACT_APP_API_URL=http://localhost:8080/api

# Google マップ API キー（クライアント専用）
REACT_APP_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY
```

### 2. パッケージのインストールと起動

```bash
# 依存パッケージのインストール
npm install

# ローカル開発サーバーの起動
npm start
```

起動が完了したら、ブラウザで `http://localhost:3000` にアクセスしてください。

---

## 🔒 Security & Deployment（デプロイおよびセキュリティ）

- **デプロイプラットフォーム：** Vercel
- **API プロキシ設定（`vercel.json`）：**
  - クライアントドメインと API ドメイン間の CORS 問題を防止し、セキュリティを強化するため、Vercel の `rewrites` 設定を通じて `/api` へのリクエストをバックエンドサーバーへリダイレクトします。
  - 設定方法は `vercel.json.example` を参照し、ご自身のバックエンドドメインに書き換えてご利用ください。

```json
{
    "rewrites": [
        {
            "source": "/api/:match*",
            "destination": "https://YOUR_BACKEND_DOMAIN/api/:match*"
        }
    ]
}
```