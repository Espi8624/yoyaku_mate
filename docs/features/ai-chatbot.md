# AI店舗案内チャットボット

> 最終更新: 2026-07-10  
> 関連ファイル: [`src/containers/chat-bot/`](../../src/containers/chat-bot/)

## 概要

Gemini APIを活用し、待機中のお客様が店舗に関する質問をリアルタイムで行うことができるAIチャットボットです。  
スタッフが介入することなく、営業時間、メニュー、位置情報などの頻出問い合わせに自動で回答します。

---

## 動作方式

```
お客様の質問入力
    │
    ▼
getStoreAIContext(storeId)        ← リアルタイム店舗コンテキスト収集
    │   (現在の待機組数、予想時間、営業時間、メニューなど)
    │
    ▼
System Prompt 構成
    │   "あなたは[店舗名]のAI案内員です。"
    │   + リアルタイム店舗データの注入
    │
    ▼
Gemini API 呼び出し (POST /api/public/ai-chat)
    │
    ▼
回答表示
```

---

## コンテキスト収集 (`getStoreAIContext`)

| フィールド | 説明 |
|------|------|
| `store_name` | 店舗名 |
| `phone` | 電話番号 |
| `opening_hours` | 営業時間 |
| `current_wait_count` | 現在の待機組数 |
| `estimated_wait_time` | 予想待ち時間 |
| `max_capacity` | 最大収容人数 |
| `last_updated` | 最終更新時刻 |

---

## コア設計: リアルタイムコンテキスト注入によるハルシネーション(Hallucination)の削減

チャットボットが回答するたびに、サーバーから最新の店舗データを取得してSystem Promptに注入します。  
これにより、「現在、何組待っていますか？」といった質問に対して、正確なリアルタイムの回答が可能になります。

---

## API

| エンドポイント | 説明 |
|-----------|------|
| `GET /api/public/store_ai_context?store_id=...` | 店舗リアルタイムコンテキスト照会 |
| `POST /api/public/ai-chat` | Gemini AIチャットボット回答リクエスト |

両エンドポイントとも、 `/public/` パスで提供されており **認証は不要** です (お客様の直接アクセスを許可)。

---

## 関連ドキュメント

- [アーキテクチャの概要](../implementation/architecture.md)
