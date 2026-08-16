# CSS ModulesへのスタイルシステムMigration

> 作成日: 2026-08-16  
> 関連ファイル: [`src/styles/design-system.css`](../../src/styles/design-system.css), [`src/styles/globals.css`](../../src/styles/globals.css), 各画面の `*.module.css`

## 背景・目的

これまで各画面は `import "./XXX.css"` によるグローバルCSSに依存しており、クラス名の衝突を避けるために `waiting-section`、`preview-label` のような画面横断で長いクラス名を都度付け直す必要があった。画面数が増えるにつれてこの命名コストと衝突リスクが大きくなったため、以下2点を目的にスタイルシステムを刷新した。

1. 画面固有のスタイルは **CSS Modules** でスコープを閉じ、クラス名の衝突を構造的に防止する。
2. 画面をまたいで繰り返し使われるUI要素 (ページコンテナ、ボタン、ポップアップ、フォームフィールドなど) は **共通のグローバルCSS** に集約し、重複定義をなくす。

## 変更内容

### 1. 新設した共通スタイル層

| ファイル | 役割 |
|---|---|
| [`src/styles/design-system.css`](../../src/styles/design-system.css) | 間隔・タイポグラフィ・角丸・シャドウ・トランジションなどのデザイントークンを `:root` のCSS変数として定義 |
| [`src/styles/globals.css`](../../src/styles/globals.css) | `.page-container` / `.page-top-bar` / `.btn-primary` / `.btn-secondary` / `.popup-overlay` / `.popup-modal` / `.field-*` / `.fixed-footer` など、CSS Modulesで管理しない共通コンポーネントクラスを定義 |

[`src/index.js`](../../src/index.js) でこの2ファイルを読み込み、既存の `colors.css` / `index.css` と併用する。

### 2. 画面ごとの `*.css` → `*.module.css` 置き換え

対象は `App`, `Board`, `ChatWindow`, `ChatbotButton`, `BackButton`, `CommonPopup`, `MapButton`, `MapWindow`, `WaitingScreenInput`, `WaitingScreenMenu`, `NotifiedScreen`, `WaitingScreenPreview`, `MenuDisplay`, `WaitingPlaceMap`, `WaitingScreen`, `CancelledScreen` の計17画面/コンポーネント。旧 `*.css` は削除し、同名の `*.module.css` を新設。JSX側は以下のように書き換えた。

```jsx
// Before
import "./WaitingScreen.css";
<div className="preview-label">...</div>

// After
import styles from "./WaitingScreen.module.css";
<div className={styles["preview-label"]}>...</div>
```

なお `page-container` / `btn-primary` / `popup-*` など globals.css 側で定義した共通クラスは、CSS Modulesを経由せず従来どおりプレーンな文字列 (`className="popup-overlay"`) で参照する。**画面固有のクラスはModules経由、複数画面で共有するクラスはグローバル文字列参照**、という2層構成になっている。

### 3. ベーススタイルの合成

`NotifiedScreen` / `CancelledScreen` / `WaitingScreenInput` / `WaitingScreenMenu` は `WaitingScreen.module.css` と視覚的に共通するレイアウトクラス (`.preview-info-group` など) を持つため、クラス定義を複製せずに以下の形でオブジェクトを合成している。

```jsx
import baseStyles from "../waiting-screen/WaitingScreen.module.css";
import specificStyles from "./NotifiedScreen.module.css";
const styles = { ...baseStyles, ...specificStyles };
```

同名キーが両方に存在する場合は `specificStyles` が優先される点に注意。

### 4. 共通ヘッダーバーへのレイアウト変更

`ChatbotButton` / `MapButton` / `BackButton` は従来、各画面に直接配置されていたが、今回 `page-top-bar` / `page-top-bar-left` / `page-top-bar-right` という共通ヘッダーバー構造でラップするよう統一した (WaitingScreen, WaitingScreenPreview, WaitingScreenMenu, WaitingScreenInput, NotifiedScreen, CancelledScreen)。

また [`WaitingScreen.jsx`](../../src/containers/waiting-screen/waiting-screen/WaitingScreen.jsx) のキャンセル確認ポップアップは、共通の `.popup-actions` レイアウトに合わせて「閉じる」ボタンを明示的に1つ追加している (従来は右上の×アイコンのみ)。

### 5. 副次的な改善 (スタイル変更と同時に実施)

- [`WaitingScreenMenu.jsx`](../../src/containers/waiting-screen/waiting-screen-menu/WaitingScreenMenu.jsx): メニュー取得ロジックを `useCallback` + `useRef`(`fetchedStoreIdRef`) に変更し、同一 `storeId` に対する重複APIコールを防止。失敗時は ref をリセットして再試行可能にした。
- [`WaitingScreenContext.jsx`](../../src/containers/waiting-screen/WaitingScreenContext.jsx): 開発用ログを `NODE_ENV === 'development'` ガードで囲み、`setState` 呼び出し前に値の変化を比較することで不要な再レンダリングを削減。

## 検証

`CI=true npm run build` でビルドが成功することを確認済み。gzip後のバンドルサイズは変更前と同等 (純粋なスタイル層の置き換えのため)。

## 関連ドキュメント

- 本リファクタリングと並行して発見・修正した多言語まわりの不具合は [troubles/003-i18n-partial-breakage.md](../troubles/003-i18n-partial-breakage.md) を参照。
