# お客様用待機画面 (Waiting Screen)

> 最終更新: 2026-07-10  
> 関連ファイル: [`src/api/waitingService.js`](../../src/api/waitingService.js), [`src/containers/waiting-screen/`](../../src/containers/waiting-screen/)

## 概要

QRコードを通じてアクセスしたお客様が、待機登録から入店完了までに至る全体のフローを管理するコア画面です。

---

## 画面フロー (Flow)

```
QRスキャン (URLアクセス)
    │
    ▼
[preview]       待機状況のプレビュー (現在の待機組数、予想時間)
    │
    ▼
[input]         人数、国籍の入力
    │
    ├── メニュー選択設定がONの場合
    │       ▼
    │   [menu]      メニューの事前選択
    │
    ▼
[waiting-screen]    リアルタイム待機画面 (SSE購読中)
    │
    ├── 呼び出し時 → [notified]    入店案内画面
    └── キャンセル時 → [cancelled]   キャンセル完了画面
```

---

## URLパラメータ

| パラメータ | 必須 | 説明 |
|---------|:----:|------|
| `store_id` | Y | 店舗ID |
| `v_token` | Y | 当日HMAC QRトークン |
| `waiting_id` | - | 登録済みのお客様が再接続する場合 |
| `lang` | - | 言語コード (自動国籍判定用) |

開発環境では、 `store_id` 未入力時にデフォルトのテスト店舗IDが自動注入されます。

---

## 主要な状態管理 (WaitingScreenContext)

全体の待機フローの状態は `WaitingScreenContext` が管理します。

| 状態 | タイプ | 説明 |
|------|------|------|
| `step` | number | 現在の画面ステップ (`1`: 登録フロー, `3`: 待機状態画面) |
| `storeId` | string | 店舗ID |
| `vToken` | string | QRトークン |
| `waitingId` | string | 登録後に発行された待機ID (localStorageにも保存) |
| `partySize` | string | 人数 (入力値、送信時にNumberへ変換) |
| `selectedNationality` | string | 国籍名 |
| `selectedLanguageCode` | string | 言語コード (i18n翻訳に使用) |
| `selectedMenus` | array | 事前選択されたメニューリスト `{ menuId, name, quantity, price }` |
| `enableMenuSelection` | boolean | メニュー事前選択の有効化有無 (店舗設定) |
| `requireOneMenuPerPerson` | boolean | 1人1メニュー必須有無 (店舗設定) |
| `isOffline` | boolean | ネットワークオフライン状態 |
| `isChatOpen` | boolean | AIチャットボットオープン状態 |
| `isMapOpen` | boolean | マップオープン状態 |

---

## API呼び出し一覧

| 関数 | エンドポイント | 説明 |
|------|-----------|------|
| `getWaitingStatus` | `GET /waiting-list` + `GET /store_settings` | プレビュー用現況 + ポリシー照会 (並行処理) |
| `getQRToken` | `GET /waiting-list?action=qr_token` | 当日QRトークン発行 |
| `submitWaiting` | `POST /waiting-list?v_token=...` | 待機登録 |
| `subscribeToWaitingStatus` | `GET /waiting-list/stream-user` | 個人待機状態のSSE購読 |
| `getWaitingDetails` | `GET /waiting-list` | 待機詳細 (再接続時の復元用) |
| `cancelWaiting` | `PATCH /waiting-list?action=status` | 待機キャンセル |
| `getMenuList` | `GET /menu-list` | メニュー一覧照会 |

---

## 国籍の自動検出

`navigator.language` またはURLの `?lang=` パラメータに基づいて国籍を自動設定します。

```
ko-KR → Intl.DisplayNames('en') → "South Korea" → nationalities.json マッピング
```

マッピングに失敗した場合は、日本語(`ja`)をデフォルト値として使用します。

---

## オフライン対応

ネットワーク接続が一時的に切断されると、画面上部に `NetworkErrorPopup` が表示され、  
`EventSource`の自動再接続メカニズムによって、オンライン復帰時にSSEが自動的に再購読されます。

---

## 関連ドキュメント

- [SSEクライアント実装](../implementation/sse-client.md)
- [アーキテクチャの概要](../implementation/architecture.md)
