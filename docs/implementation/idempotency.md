# 登録の冪等性 (Idempotency)

> 最終更新: 2026-09-18
> 関連ファイル: [`src/containers/waiting-screen/WaitingScreenContext.jsx`](../../src/containers/waiting-screen/WaitingScreenContext.jsx)

## 問題の状況

お客様がQRから待機登録をする際、通信が不安定で応答を受け取れないことがある。
サーバーは正常に処理しているのに画面上は失敗に見えると、お客様は登録ボタンを押し直す。
その結果**一人のお客様が整理券を2枚受け取る。**

---

## 解決: `waiting_id` を「登録1件」ごとに発行する

サーバーは `(store_id, waiting_id)` が同じ要求を「同じ登録の再送」とみなして
既存レコードを返す。したがってクライアントが**再試行で同じキーを送って**初めて成立する。

```js
// WaitingScreenContext.jsx
const pendingWaitingIdRef = useRef(null);

if (!pendingWaitingIdRef.current) {
  pendingWaitingIdRef.current = freshWaitingId;   // 最初の試行でのみ発行
}
const clientWaitingId = pendingWaitingIdRef.current;
```

### キーの寿命

| 時点 | 処理 | 理由 |
|---|---|---|
| 最初の送信 | 発行 | |
| 送信失敗 | **保持** | 次の試行で再利用しないと二重登録を防げない |
| 登録成功(2xx) | 破棄 | 残すと次の登録で以前のレコードが返ってくる |
| `clearWaitingIdentity()` | 破棄 | 白紙に戻す = これからするのは「別の登録」 |

`clearWaitingIdentity` は待機の身元(localStorage・URL・state)を1か所で消す関数である。
キーも必ずここに含める — 消す場所が散らばると必ず1つ消し忘れる。

### stateではなくrefを使う理由

再レンダーを起こす必要が無く、stateは更新が非同期のため**連打時に前の値のまま
2回送ってしまう**可能性がある。

### `registration_time` は毎回更新する

キーと違って時刻は再試行のたびに作り直す。一緒に固定すると、しばらく経ってから
再試行した場合に古い時刻で登録され、待ち順がずれる。

---

## 2026-09-18 以前は機能していなかった

`getJSTDateStrings()` が `handleSubmitWaiting` の**中で**呼ばれていたため、
**ボタンを押すたびに新しいキー**が作られていた。サーバーから見れば再送ではなく
別々の登録であり、防ぎたかったケースがそのまま通っていた。

さらにこのアプリには**自動リトライが無い**(axios-retry もインターセプタも無い)。
つまり「再試行」とはお客様がボタンを押し直すことであり、そのたびにキーが変わっていた。

当時実際に冪等キーが効いていたのは**混雑ポップアップの確認ボタンの連打**だけである。
その経路だけは `pendingPayload` に payload ごと(キーを含めて)保持されるため。

---

## サーバー側との関係

クライアントだけでは完結しない。同時に届いた2つの再送は同じキーを送っていても、
サーバーが「照会してから挿入」をすると両方が「存在しない」を見て両方挿入する。
サーバー側の `(store_id, waiting_id)` ユニークインデックスが併せて必要になる。

詳細は `yoyaku_mate_server/docs/implementation/idempotency.md` を参照。

---

## 関連ドキュメント

- [待機画面の機能仕様](../features/waiting-screen.md)
