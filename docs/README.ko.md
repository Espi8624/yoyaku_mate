# docs — yoyaku_mate (Web Client) 문서 인덱스

## 구조

```
docs/
├── features/           # 기능 사양 (무엇을 하는가)
├── implementation/     # 기술 구현 상세 (어떻게 구현했는가)
├── decisions/          # 기술 선택 근거 (ADR)
├── troubles/           # 트러블슈팅 / 회고 기록
└── refactoring/        # 리팩토링 기록
```

---

## Features (기능 사양)

| 문서 | 설명 |
|------|------|
| [waiting-screen.md](./features/waiting-screen.ko.md) | 손님 대기 화면 (등록 → 실시간 대기 → 완료/취소) |
| [ai-chatbot.md](./features/ai-chatbot.ko.md) | Gemini AI 점포 안내 챗봇 |

---

## Implementation (구현 상세)

| 문서 | 설명 |
|------|------|
| [architecture.md](./implementation/architecture.ko.md) | 프로젝트 구조 및 데이터 흐름 |
| [sse-client.md](./implementation/sse-client.ko.md) | SSE 구독 클라이언트 구현 |

---

## Decisions (기술 결정)

| 문서 | 결정 내용 |
|------|----------|
| [ADR-001-vercel-proxy.md](./decisions/ADR-001-vercel-proxy.ko.md) | Vercel Rewrite 프록시 채택 이유 |

---

## Troubles (트러블슈팅 / 회고)

| 문서 | 설명 |
|------|------|
| [001-lessons-learned.md](./troubles/001-lessons-learned.ko.md) | CORS, SSE 재연결, AI 프롬프팅 최적화 회고 |
| [002-google-maps-api-loop.md](./troubles/002-google-maps-api-loop.ko.md) | 3만 엔의 교훈: Google Maps API 무한 루프 사태와 방어 로직 |

---

## Refactoring (리팩토링)

*기록 예정*
