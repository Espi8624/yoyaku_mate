# AI 점포 안내 챗봇

> 최종 수정: 2026-07-10  
> 관련 파일: [`src/containers/chat-bot/`](../../src/containers/chat-bot/)

## 개요

Gemini API를 활용하여 대기 중인 손님이 점포 관련 질문을 실시간으로 할 수 있는 AI 챗봇입니다.  
스태프 개입 없이 영업시간, 메뉴, 위치 등 반복적인 문의에 자동으로 답변합니다.

---

## 동작 방식

```
손님 질문 입력
    │
    ▼
getStoreAIContext(storeId)        ← 실시간 점포 컨텍스트 수집
    │   (현재 대기 수, 예상 시간, 영업시간, 메뉴 등)
    │
    ▼
System Prompt 구성
    │   "당신은 [점포명]의 AI 안내원입니다."
    │   + 실시간 점포 데이터 주입
    │
    ▼
Gemini API 호출 (POST /api/public/ai-chat)
    │
    ▼
응답 표시
```

---

## 컨텍스트 수집 (`getStoreAIContext`)

| 필드 | 설명 |
|------|------|
| `store_name` | 점포명 |
| `phone` | 전화번호 |
| `opening_hours` | 영업시간 |
| `current_wait_count` | 현재 대기 조 수 |
| `estimated_wait_time` | 예상 대기 시간 |
| `max_capacity` | 최대 수용 인원 |
| `last_updated` | 마지막 업데이트 시각 |

---

## 핵심 설계: 실시간 컨텍스트 주입으로 환각(Hallucination) 감소

챗봇 응답 시점마다 서버에서 실시간 점포 데이터를 가져와 System Prompt에 주입합니다.  
이를 통해 "현재 대기가 몇 명이에요?" 같은 질문에 정확한 실시간 답변이 가능합니다.

---

## API

| 엔드포인트 | 설명 |
|-----------|------|
| `GET /api/public/store_ai_context?store_id=...` | 점포 실시간 컨텍스트 조회 |
| `POST /api/public/ai-chat` | Gemini AI 챗봇 응답 요청 |

두 엔드포인트 모두 `/public/` 경로로 **인증 불필요** (손님 직접 접근 허용).

---

## 관련 문서

- [아키텍처 개요](../implementation/architecture.ko.md)
