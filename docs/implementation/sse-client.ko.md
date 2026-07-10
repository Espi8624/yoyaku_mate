# SSE 클라이언트 구현

> 최종 수정: 2026-07-10  
> 관련 파일: [`src/api/waitingService.js`](../../src/api/waitingService.js)

## 개요

브라우저 내장 `EventSource` API를 사용하여 서버의 SSE 스트림을 구독합니다.  
별도 라이브러리 없이 표준 Web API만으로 구현했습니다.

---

## 구독 채널 (2종류)

| 함수 | 엔드포인트 | 사용처 |
|------|-----------|--------|
| `subscribeToWaitingList` | `/waiting-list/stream?store_id=` | 현황판(Board) |
| `subscribeToWaitingStatus` | `/waiting-list/stream-user?store_id=&waiting_id=` | 개인 대기 화면 |

---

## 구현 코드

```javascript
// src/api/waitingService.js

export const subscribeToWaitingStatus = (storeId, waitingId, onMessage, onError) => {
  const url = `${API_BASE_URL}/waiting-list/stream-user?store_id=${storeId}&waiting_id=${waitingId}`;
  const eventSource = new EventSource(url);

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (e) {
      console.error('[SSE User] JSON parse error:', e);
    }
  };

  eventSource.onerror = (error) => {
    console.warn('[SSE User] Connection error:', error);
    if (onError) onError(error);
  };

  return eventSource;  // 호출자가 .close()로 정리
};
```

---

## 연결 정리 (Cleanup)

반환된 `EventSource` 인스턴스를 컴포넌트 언마운트 시 반드시 `.close()` 합니다.

```javascript
// React 컴포넌트에서 사용 예시
useEffect(() => {
  const es = subscribeToWaitingStatus(storeId, waitingId, onMessage, onError);
  return () => es.close();  // cleanup
}, [storeId, waitingId]);
```

---

## 자동 재연결

`EventSource`는 연결이 끊기면 브라우저가 **자동으로 재연결**을 시도합니다.  
별도 재연결 로직 구현 없이, 오프라인 복귀 후에도 SSE 스트림이 자동으로 복구됩니다.

재연결 시 서버는 연결 즉시 현재 상태를 초기 데이터로 전송하므로 누락 없이 동기화됩니다.

---

## 관련 문서

- [손님 대기 화면](../features/waiting-screen.ko.md)
- [서버 측 SSE 구현](../../../yoyaku_mate_server/docs/implementation/sse.ko.md)
