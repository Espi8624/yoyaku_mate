# 多言語対応が一部無効化されていた問題

> 作成日: 2026-08-16  
> 関連ファイル: [`src/data/nationalities.json`](../../src/data/nationalities.json), [`src/hook/useTranslation.js`](../../src/hook/useTranslation.js), [`src/i18n/*.json`](../../src/i18n), [`WaitingScreenContext.jsx`](../../src/containers/waiting-screen/WaitingScreenContext.jsx), [`WaitingScreenPreview.jsx`](../../src/containers/waiting-screen/waiting-screen-preview/WaitingScreenPreview.jsx)

## 問題の概要

CSS Modulesリファクタリング ([refactoring/001](../refactoring/001-css-modules-migration.md)) の作業中、複数言語に翻訳済みのはずの `src/i18n/*.json` (ja/en/ko/fr/de/ru/vi/th/zh/id/ar/es/it/pt の14言語) が、実際には日本語・韓国語・フランス語・英語以外のユーザーにほとんど届いていないことが判明した。原因は1つではなく、独立した4つの不具合が重なって多言語対応を無力化していた。

---

## 原因分析

### 1. 国籍→言語コードのマッピング表がほぼ全滅していた (最大の原因)

お客様の言語は [`WaitingScreenContext.jsx`](../../src/containers/waiting-screen/WaitingScreenContext.jsx) の `getNationalityFromLanguage()` が、ブラウザの地域情報から国名を取得し、[`nationalities.json`](../../src/data/nationalities.json) の該当国の `languageCode` を返すことで決定される。

ところが `nationalities.json` を調査すると、200ヶ国中 **196ヶ国が `languageCode: "en"` に固定**されていた。`de.json` / `ru.json` / `vi.json` / `th.json` / `zh.json` / `id.json` / `ar.json` などは翻訳が完備されていたにもかかわらず、そこへ到達する経路自体が存在しなかった。

```json
// 修正前 (Germany の例)
{ "name": "Germany", "languageCode": "en" }

// 修正後
{ "name": "Germany", "languageCode": "de" }
```

主要61ヶ国 (ドイツ語圏、ロシア語圏、中国語圏、スペイン語圏21ヶ国、アラビア語圏21ヶ国など) の `languageCode` を実在の翻訳ファイルに合わせて修正した。

### 2. es / it / pt が翻訳フックに接続されていなかった

[`useTranslation.js`](../../src/hook/useTranslation.js) の `translations` オブジェクトに `es` / `it` / `pt` が import すらされていなかった。翻訳ファイル自体は完成していたが、コード上到達不可能な状態 (dead file) だった。

```javascript
// 修正前
const translations = { ja, en, ko, fr, de, ru, vi, th, zh, id, ar };

// 修正後
const translations = { ja, en, ko, fr, de, ru, vi, th, zh, id, ar, es, it, pt };
```

### 3. 翻訳キーの欠落 (`ja.json` にしか存在しないキー)

`waiting_screen_input.party_size_placeholder` / `contact_placeholder` / `note_placeholder`、`waiting_screen_notified.title/message`、`waiting_screen_preview.pre_order` などが `ja.json` にのみ存在し、他13言語には存在しなかった。フォールバック処理がないコンポーネントでは値が `undefined` になり、入力欄のプレースホルダーが空白のまま表示される不具合につながっていた。

逆に `waiting_screen_preview.popup.{close,back,confirm}` は **`ja.json` にだけ存在せず**、他13言語には揃っていた。これは [`CongestionPopup.jsx`](../../src/containers/waiting-screen/waiting-screen-preview/CongestionPopup.jsx) で実際に使われているキーで、日本語ユーザーがポップアップの「戻る/確定する/閉じる」ボタンで空白テキストを見ていたことになる。全14言語のキー構成を突き合わせ、92キーに統一した。

### 4. i18nシステムを迂回したハードコーディング

[`WaitingScreenPreview.jsx`](../../src/containers/waiting-screen/waiting-screen-preview/WaitingScreenPreview.jsx) と [`WaitingScreenContext.jsx`](../../src/containers/waiting-screen/WaitingScreenContext.jsx) の一部のポップアップ文言が、`t.xxx` 参照ではなく次のような三項演算子で直書きされていた。

```jsx
// 修正前
{selectedLanguageCode === 'ja' ? 'この内容で登録を進めてもよろしいですか？' : 'Is it okay to proceed with this content?'}
```

これは日本語 / 英語の2択しか考慮しておらず、残り12言語のユーザーは常に英語表示になっていた。新規キー (`waiting_screen_preview.submit_confirm`、`waiting_screen.registration_complete_popup`、`waiting_screen.completed_notification_popup`) を全14言語分追加し、`t.xxx` 参照に戻した。

---

## 解決策のまとめ

| 対応 | 内容 |
|---|---|
| `nationalities.json` | 61ヶ国の `languageCode` を実装済み翻訳ファイルに合わせて修正 |
| `useTranslation.js` | `es` / `it` / `pt` の import と `translations` オブジェクトへの登録を追加 |
| `i18n/*.json` (14ファイル) | 欠落キーを補完し、全言語92キーで統一。未使用の孤児キー (`waiting_screen_preview.name_label`) を削除 |
| `WaitingScreenPreview.jsx` / `WaitingScreenContext.jsx` | ハードコーディングされた三項演算子3箇所を `t.xxx` 参照に置き換え |

## 検証

- 14言語ファイルのキー集合が完全一致することをスクリプトで確認 (missing/extra 各0件)
- `CI=true npm run build` でビルド成功を確認

---

## Lessons Learned

- **翻訳ファイルが存在する = 機能している、ではない。** 実際にそのファイルへ到達する経路 (import 登録、マッピングテーブル、キー参照) まで含めて検証しないと、翻訳作業自体が死んだコードになり得る。
- 多言語対応のキー漏れは、`ja.json` を基準にした **全言語のキー集合比較スクリプト** で機械的に検出できる。今後翻訳キーを追加・変更する際は、必ず全14言語ファイルへの反映をセットで行う。
- 「対応言語が2つしかない」ことを前提にした三項演算子 (`lang === 'ja' ? A : B`) は、多言語対応システムを導入している画面では原則禁止し、必ず `useTranslation` 経由の参照にする。
