# ADR-001: Vercel Rewrite 프록시 채택

> 작성일: 2026-07-10  
> 상태: 확정

## 컨텍스트

React 웹 클라이언트(Vercel)에서 Go 백엔드 서버(fly.io)로 API 요청을 보낼 때, 두 도메인이 달라 CORS 문제가 발생합니다. 이를 해결하는 방법을 검토했습니다.

---

## 검토 대상

| 방법 | 설명 | 문제점 |
|------|------|--------|
| 백엔드 CORS 허용 | `Access-Control-Allow-Origin: *` 설정 | API 엔드포인트 URL 노출 |
| 별도 프록시 서버 | Nginx 등 중간 서버 운영 | 인프라 복잡도 증가 |
| **Vercel Rewrite** | `vercel.json`에서 `/api/*` → 백엔드 URL 포워드 | 추가 인프라 없음 |

---

## 결정: Vercel Rewrite 프록시 채택

### 이유

1. **백엔드 URL 숨김**: 클라이언트 코드에서 실제 백엔드 서버 주소가 노출되지 않습니다.

2. **추가 인프라 불필요**: `vercel.json` 설정 몇 줄로 구현 가능하며, 별도 프록시 서버를 운영할 필요가 없습니다.

3. **환경 분리 용이**: 로컬 환경에서는 `REACT_APP_API_URL`로 직접 호출하고, 프로덕션에서는 `/api`로 통일된 경로를 사용합니다.

```javascript
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? "/api"                          // Vercel Proxy 경유
  : process.env.REACT_APP_API_URL;  // 로컬 직접 호출
```

### 트레이드오프 (수용 가능)

- Vercel 플랫폼에 종속됨. 배포 플랫폼 변경 시 프록시 설정 재작성 필요
- SSE 연결도 Vercel Edge를 경유하므로 지연이 소폭 증가할 수 있음

---

## 관련 문서

- [아키텍처 개요](../implementation/architecture.ko.md)
