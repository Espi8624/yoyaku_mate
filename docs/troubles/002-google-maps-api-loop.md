# 3万画素の教訓: Google Maps API無限ループ障害

> 作成日: 2026-07-10  
> 関連ファイル: [`WaitingPlaceMap.jsx`](../../src/containers/waiting-screen/waiting-screen/WaitingPlaceMap.jsx)

## 障害の概要

開発中、お客様用待機画面で店舗周辺の推奨スポットを表示するマップ機能を組み込んだところ、一晩のうちに **Google Maps API の請求金額が約3万円 (30,000¥)** に跳ね上がる事故が発生しました。

原因は、Reactの `useEffect` における依存性配列の管理ミスによる **APIの無限呼び出し (Infinite Loop)** でした。

---

## 原因分析

`WaitingPlaceMap.jsx` 内では、主に以下の2つのAPIが呼び出されていました。
1. `Geocoder.geocode()`: 店舗のテキスト住所を緯度・経度へ変換
2. `Place.searchNearby()`: 店舗周辺のカテゴリ別スポット検索 (1リクエストあたりの課金単価が高い)

### 無限ループを誘発した従来のコードパターン

```javascript
useEffect(() => {
    // 課題1: Geocoding実行のガード条件(脱出条件)の欠落
    if (isLoaded && storeInfo && storeInfo.address) {
        geocoder.geocode({ address: storeInfo.address }, (results, status) => {
            const newCenter = { lat: location.lat(), lng: location.lng() };
            // 課題2: API結果による状態変更が、このuseEffectを再トリガー
            setStoreLocation(newCenter);
        });
    }
}, [isLoaded, storeInfo, storeLocation]); // storeLocationが変更されるたびに再実行！
```

1. `useEffect` が初回実行され、Geocoding APIを呼び出す。
2. APIレスポンスに基づき、 `setStoreLocation()` で状態を更新。
3. 状態が更新されたため、コンポーネントが再レンダリングされる。
4. 依存性配列内の `storeLocation` が新しいオブジェクト参照に切り替わるため、 `useEffect` が再実行される。
5. **以降、1秒間に数十回ものGeocoding APIがミリ秒単位でループし続ける。**

---

## 解決策と防御ロジック (現在の実装)

この事態を機に、現在は不要なAPIリクエストを完全に防御するための3重のセキュリティが組み込まれています。

### 1. 確実な早期脱出条件 (Guard Clause)
すでに座標の変換が完了している場合は、ジオコーダーを再起動させないように `!storeLocation` 条件を追加しました。
```javascript
// storeLocationがnullの初期状態でのみ1度だけ実行される
if (isLoaded && storeInfo && storeInfo.address && !storeLocation) { ... }
```

### 2. useRefによるAPIレスポンスのメモリキャッシュ
高価な `Place.searchNearby()` の呼び出し回数を減らすため、ユーザーがカテゴリ（カフェ、公園など）のタブを切り替えた際、すでに読み込んだことのあるデータは `useRef` を介して即座にローカルキャッシュからロードします。
```javascript
const placesCache = useRef({});

// すでにキャッシュが存在する場合はAPIを呼ばずに即座に状態をセットして終了
if (placesCache.current[activeCategory]) {
    setNearbyPlaces(placesCache.current[activeCategory]);
    return;
}

// 初回取得時はAPIから取得し、キャッシュへ書き込む
placesCache.current[activeCategory] = mappedPlaces;
```

### 3. レースコンディション (競合状態) の防御
ユーザーがカテゴリタブを高速で連続クリックした場合に、以前のリクエストの応答が遅れて最新の表示結果を古いデータで上書きしてしまわないよう、 `fetchRequestId` ガードを導入しました。
```javascript
const currentRequestId = ++fetchRequestId.current;
// ... APIリクエスト ...
if (currentRequestId !== fetchRequestId.current) return; // 最新のリクエストIDでなければ破棄
```

---

## Lessons Learned

- **外部有料APIを useEffect 内で取り扱う際は極めて慎重に設計する必要があります。** APIのレスポンス結果が依存性配列に含まれる値を間接的に更新し、再トリガーの無限ループを形成していないか常に監視する必要があります。
- 開発時およびテスト時には、Google Cloud Consoleなどのコンソール側で **「1日の上限リクエスト数 (Quota Limit)」を極めて低く制限** しておき、事故発生時の上限被害を最小限に食い止める運用を推奨します。
