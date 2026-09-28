# 아키텍처 개요

> 최종 수정: 2026-09-06

## 기술 스택

| 항목 | 기술 |
|------|------|
| Framework | React 19 |
| Router | React Router DOM 7 |
| HTTP | Axios |
| 실시간 스트림 | EventSource (SSE) |
| 지도 | Google Maps API (`@react-google-maps/api`) |
| AI | Gemini API |
| i18n | 자체 구현 (ja/en/ko/fr/de/ru/vi/th/zh/id/ar/es/it/pt) |
| 배포 | Vercel (프로덕션) / Cloudflare Workers Static Assets (개발) |

---

## 디렉토리 구조

```
src/
├── api/
│   └── waitingService.js     # 모든 API 호출 정의 (Axios + EventSource)
│
├── containers/               # 화면 단위 비즈니스 로직
│   ├── waiting-screen/       # 손님 대기 전체 흐름 (Context + Flow)
│   │   ├── WaitingScreenContext.jsx   # 전역 상태 관리
│   │   ├── WaitingScreenFlow.jsx      # 단계별 화면 렌더링
│   │   ├── waiting-screen-input/     # 인원/국적 입력
│   │   ├── waiting-screen-menu/      # 메뉴 사전 선택
│   │   ├── waiting-screen-preview/   # 대기 현황 미리보기
│   │   ├── waiting-screen/           # 실시간 대기 화면
│   │   ├── waiting-screen-notified/  # 호출 알림 화면
│   │   └── waiting-screen-cancelled/ # 취소 완료 화면
│   ├── board/                # 실시간 대기 현황판 (점포 표시용)
│   └── chat-bot/             # Gemini AI 챗봇
│
├── components/               # 공통 재사용 UI 컴포넌트
├── hook/                     # React 커스텀 훅
├── i18n/                     # 다국어 리소스 (ja.json, ko.json 등)
├── data/                     # 정적 데이터 (nationalities.json)
├── styles/                   # 글로벌 스타일
└── utils/                    # 공통 유틸리티 함수
```

---

## 네트워크 흐름

```
브라우저
    │
    │  REACT_APP_API_URL로 직접 요청 (CORS)
    ▼
Backend Server (fly.io)
    │
    ├── REST 응답
    └── SSE 스트림 (Event Stream)
    
브라우저
    │
    │  AI Prompt
    ▼
Gemini API (직접 호출)
```

---

## 상태 관리 방식

별도 상태 관리 라이브러리 없이 **React Context API**를 사용합니다.

- `WaitingScreenContext`: 대기 화면 전체 흐름 상태
- 각 화면 컴포넌트는 `useWaitingScreen()` 훅으로 Context에 접근

---

## 환경별 API URL

```javascript
// 배포 플랫폼과 무관하게 REACT_APP_API_URL로 실제 백엔드 URL을 직접 지정한다
// (Vercel Rewrite 같은 중계는 더 이상 사용하지 않음)
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080/api";
```

---

## 관련 문서

- [손님 대기 화면 기능 사양](../features/waiting-screen.ko.md)
- [SSE 클라이언트 구현](./sse-client.ko.md)
- [Vercel 프록시 선택 근거 (폐기됨)](../decisions/ADR-001-vercel-proxy.ko.md)
- [Vercel 프록시 폐기 경위](../decisions/ADR-002-remove-vercel-proxy.ko.md)
