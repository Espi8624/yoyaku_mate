# ADR-002: Vercel Rewrite 프록시 폐기

> 작성일: 2026-09-06  
> 상태: 확정

## 컨텍스트

[ADR-001](./ADR-001-vercel-proxy.ko.md)에서는 CORS 우회와 백엔드 URL 은닉을 위해 Vercel Rewrite(`vercel.json`의 `/api/*` 포워딩)를 채택했다.

그런데 개발/테스트용 배포처로 Cloudflare(Workers Static Assets)를 추가로 검토하는 과정에서 다음 문제가 드러났다.

- `API_BASE_URL` 분기가 `process.env.NODE_ENV === 'production'` 기준이었는데, 이는 "Vercel에 배포됐는가"가 아니라 "`npm run build`로 프로덕션 빌드됐는가"만을 나타내는 값이다. 따라서 Vercel 이외의 플랫폼으로 빌드·배포해도 동일한 분기를 타서 존재하지 않는 `/api` 상대경로로 요청을 보내게 되어 통신이 실패한다.
- ADR-001의 트레이드오프 항목에서 이미 "배포 플랫폼 변경 시 프록시 설정 재작성 필요"라고 지적했던 대로, Vercel 전용 메커니즘에 의존하는 설계는 복수 플랫폼 운영(프로덕션: Vercel, 개발: Cloudflare)과 궁합이 좋지 않다.

---

## 결정: Vercel Rewrite 프록시를 폐기하고 `REACT_APP_API_URL`로 일원화

`NODE_ENV` 기반 분기를 없애고, 배포 플랫폼과 무관하게 환경변수 `REACT_APP_API_URL`로 실제 백엔드 URL을 직접 지정하는 방식으로 통일했다.

```javascript
// 변경 전
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? "/api"
  : (process.env.REACT_APP_API_URL || "http://localhost:8080/api");

// 변경 후
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080/api";
```

이에 따라 `vercel.json.example`과 `.gitignore`의 `vercel.json` 관련 항목도 함께 삭제했다.

### 이유

1. **플랫폼 비의존**: 어떤 호스팅처(Vercel / Cloudflare Pages, Workers / 그 외 정적 호스팅)든 동일한 빌드 산출물이 그대로 동작한다.
2. **설정 단순화**: 플랫폼 쪽 Rewrite/프록시 설정이 불필요해지고, 환경변수 설정만으로 끝난다.
3. **백엔드 CORS 설정은 원래부터 필요**: `yoyaku_mate_server`는 `AllowOrigins`로 오리진을 허용 제어하고 있어, 프록시 없이도 안전하게 CORS를 운영할 수 있다.

### 트레이드오프 (수용 가능)

- 백엔드 실제 URL이 클라이언트 번들에 포함됨 (ADR-001 시점에도 `REACT_APP_API_URL`을 쓰는 로컬 개발에서는 동일했음)
- SSE 연결도 브라우저에서 fly.io로 직접 연결되므로, Vercel Edge를 경유하던 것보다 지연이 다소 개선될 수 있음

---

## 관련 문서

- [ADR-001: Vercel Rewrite 프록시 채택 (폐기됨)](./ADR-001-vercel-proxy.ko.md)
- [아키텍처 개요](../implementation/architecture.ko.md)
