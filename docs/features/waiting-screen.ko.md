# 손님 대기 화면 (Waiting Screen)

> 최종 수정: 2026-07-10  
> 관련 파일: [`src/api/waitingService.js`](../../src/api/waitingService.js), [`src/containers/waiting-screen/`](../../src/containers/waiting-screen/)

## 개요

QR 코드를 통해 진입한 손님이 대기 등록부터 입장 완료까지 경험하는 전체 흐름을 관리하는 핵심 화면입니다.

---

## 화면 흐름 (Flow)

```
QR 스캔 (URL 진입)
    │
    ▼
[preview]       대기 현황 미리보기 (현재 대기 수, 예상 시간)
    │
    ▼
[input]         인원 수, 국적 입력
    │
    ├── 메뉴 선택 설정 ON
    │       ▼
    │   [menu]      메뉴 사전 선택
    │
    ▼
[waiting-screen]    실시간 대기 화면 (SSE 구독 중)
    │
    ├── 호출됨 → [notified]    입장 안내 화면
    └── 취소   → [cancelled]   취소 완료 화면
```

---

## URL 파라미터

| 파라미터 | 필수 | 설명 |
|---------|:----:|------|
| `store_id` | Y | 점포 ID |
| `v_token` | Y | 당일 HMAC QR 토큰 |
| `waiting_id` | - | 이미 등록된 손님이 재접속 시 |
| `lang` | - | 언어 코드 (자동 국적 감지) |

개발 환경에서는 `store_id` 미입력 시 기본 테스트 점포 ID가 자동 주입됩니다.

---

## 주요 상태 관리 (WaitingScreenContext)

전체 대기 흐름의 상태는 `WaitingScreenContext`가 관리합니다.

| 상태 | 타입 | 설명 |
|------|------|------|
| `step` | number | 현재 화면 단계 (`1`: 등록 흐름, `3`: 대기 상태 화면) |
| `storeId` | string | 점포 ID |
| `vToken` | string | QR 토큰 |
| `waitingId` | string | 등록 후 발급된 대기 ID (localStorage에도 저장) |
| `partySize` | string | 인원 수 (입력값, 제출 시 Number 변환) |
| `selectedNationality` | string | 국적명 |
| `selectedLanguageCode` | string | 언어 코드 (i18n 번역에 사용) |
| `selectedMenus` | array | 사전 선택한 메뉴 목록 `{ menuId, name, quantity, price }` |
| `enableMenuSelection` | boolean | 메뉴 사전 선택 활성화 여부 (점포 설정) |
| `requireOneMenuPerPerson` | boolean | 1인 1메뉴 필수 여부 (점포 설정) |
| `isOffline` | boolean | 네트워크 오프라인 상태 |
| `isChatOpen` | boolean | AI 챗봇 열림 상태 |
| `isMapOpen` | boolean | 지도 열림 상태 |

---

## API 호출 목록

| 함수 | 엔드포인트 | 설명 |
|------|-----------|------|
| `getWaitingStatus` | `GET /waiting-list` + `GET /store_settings` | 미리보기용 현황 + 정책 조회 (병렬) |
| `getQRToken` | `GET /waiting-list?action=qr_token` | 당일 QR 토큰 발급 |
| `submitWaiting` | `POST /waiting-list?v_token=...` | 대기 등록 |
| `subscribeToWaitingStatus` | `GET /waiting-list/stream-user` | 개인 대기 상태 SSE 구독 |
| `getWaitingDetails` | `GET /waiting-list` | 대기 상세 (재접속 시 복원용) |
| `cancelWaiting` | `PATCH /waiting-list?action=status` | 대기 취소 |
| `getMenuList` | `GET /menu-list` | 메뉴 목록 조회 |

---

## 국적 자동 감지

`navigator.language` 또는 URL `?lang=` 파라미터를 기반으로 국적을 자동 설정합니다.

```
ko-KR → Intl.DisplayNames('en') → "South Korea" → nationalities.json 매핑
```

매핑 실패 시 일본어(`ja`)를 기본값으로 사용합니다.

---

## 오프라인 대응

네트워크 연결이 일시적으로 끊기면 `NetworkErrorPopup`이 화면 상단에 표시되며,  
`EventSource`의 자동 재연결 메커니즘에 의해 온라인 복귀 시 SSE가 자동으로 재구독됩니다.

---

## 관련 문서

- [SSE 클라이언트 구현](../implementation/sse-client.ko.md)
- [아키텍처 개요](../implementation/architecture.ko.md)
