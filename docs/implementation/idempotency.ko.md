# 등록 멱등성 (Idempotency)

> 최종 수정: 2026-09-18
> 관련 파일: [`src/containers/waiting-screen/WaitingScreenContext.jsx`](../../src/containers/waiting-screen/WaitingScreenContext.jsx)

## 문제 상황

손님이 QR로 대기 등록을 할 때, 통신이 불안정해 응답을 받지 못하는 경우가 있다.
서버는 정상 처리했는데 화면에는 실패로 보이면, 손님은 등록 버튼을 다시 누른다.
그 결과 **한 손님이 번호표를 두 장 받는다.**

---

## 해결: `waiting_id`를 "등록 1건"마다 발행한다

서버는 `(store_id, waiting_id)`가 같은 요청을 "같은 등록의 재전송"으로 보고
기존 레코드를 반환한다. 따라서 클라이언트가 **재시도에서 같은 키를 보내야** 성립한다.

```js
// WaitingScreenContext.jsx
const pendingWaitingIdRef = useRef(null);

if (!pendingWaitingIdRef.current) {
  pendingWaitingIdRef.current = freshWaitingId;   // 최초 시도에서만 발행
}
const clientWaitingId = pendingWaitingIdRef.current;
```

### 키의 수명

| 시점 | 처리 | 이유 |
|---|---|---|
| 최초 제출 | 발행 | |
| 제출 실패 | **유지** | 다음 시도에서 재사용해야 이중 등록을 막는다 |
| 등록 성공(2xx) | 폐기 | 남겨두면 다음 등록에서 이전 레코드가 반환된다 |
| `clearWaitingIdentity()` | 폐기 | 백지 상태 = 앞으로 할 것은 "다른 등록"이다 |

`clearWaitingIdentity`는 대기 신원(localStorage·URL·state)을 한곳에서 지우는 함수다.
키도 반드시 여기에 포함시킨다 — 지우는 곳이 흩어지면 반드시 하나를 빠뜨린다.

### state가 아니라 ref를 쓴 이유

리렌더를 일으킬 필요가 없고, state는 갱신이 비동기라 **연타 시 이전 값 그대로 두 번
보내는** 경우가 생길 수 있다.

### `registration_time`은 매번 갱신한다

키와 달리 시각은 재시도마다 새로 만든다. 함께 고정하면 한참 뒤에 재시도했을 때
옛 시각으로 등록되어 대기 순서가 어긋난다.

---

## 2026-09-18 이전에는 동작하지 않았다

`getJSTDateStrings()`가 `handleSubmitWaiting` **안에서** 호출되고 있어,
**버튼을 누를 때마다 새 키**가 만들어졌다. 서버에서 보면 재전송이 아니라 별개의 등록이라
막으려던 케이스가 그대로 통과했다.

게다가 이 앱에는 **자동 재시도가 없다**(axios-retry도 인터셉터도 없음).
즉 "재시도"란 손님이 버튼을 다시 누르는 것이고, 그때마다 키가 새로 생겼다.

당시 실제로 멱등 키가 듣던 경우는 **혼잡 팝업의 확인 버튼 연타**뿐이었다.
그 경로만 `pendingPayload`에 payload째(키 포함) 보관되기 때문이다.

---

## 서버 측과의 관계

클라이언트만으로는 완결되지 않는다. 동시에 도착한 두 재전송은 같은 키를 보내더라도,
서버가 "조회 후 삽입"을 하면 둘 다 "없음"을 보고 둘 다 삽입한다.
서버 쪽 `(store_id, waiting_id)` 유니크 인덱스가 함께 있어야 한다.

자세한 내용은 `yoyaku_mate_server/docs/implementation/idempotency.ko.md` 참조.

---

## 관련 문서

- [대기 화면 기능 사양](../features/waiting-screen.ko.md)
