# CSS Modules 스타일 시스템 마이그레이션

> 작성일: 2026-08-16  
> 관련 파일: [`src/styles/design-system.css`](../../src/styles/design-system.css), [`src/styles/globals.css`](../../src/styles/globals.css), 각 화면의 `*.module.css`

## 배경 및 목적

기존에는 각 화면이 `import "./XXX.css"` 형태의 전역 CSS에 의존하고 있어서, 클래스명 충돌을 피하기 위해 `waiting-section`, `preview-label`처럼 화면을 넘나드는 긴 클래스명을 매번 새로 붙여야 했다. 화면 수가 늘어날수록 이 네이밍 비용과 충돌 위험이 커졌기 때문에, 다음 두 가지를 목적으로 스타일 시스템을 개편했다.

1. 화면 고유 스타일은 **CSS Modules**로 스코프를 닫아 클래스명 충돌을 구조적으로 방지한다.
2. 여러 화면에서 반복적으로 쓰이는 UI 요소(페이지 컨테이너, 버튼, 팝업, 폼 필드 등)는 **공통 전역 CSS**로 모아 중복 정의를 없앤다.

## 변경 내용

### 1. 신설한 공통 스타일 레이어

| 파일 | 역할 |
|---|---|
| [`src/styles/design-system.css`](../../src/styles/design-system.css) | 간격·타이포그래피·radius·shadow·transition 등 디자인 토큰을 `:root` CSS 변수로 정의 |
| [`src/styles/globals.css`](../../src/styles/globals.css) | `.page-container` / `.page-top-bar` / `.btn-primary` / `.btn-secondary` / `.popup-overlay` / `.popup-modal` / `.field-*` / `.fixed-footer` 등, CSS Modules로 관리하지 않는 공통 컴포넌트 클래스 정의 |

[`src/index.js`](../../src/index.js)에서 이 두 파일을 로드하며, 기존 `colors.css` / `index.css`와 함께 사용한다.

### 2. 화면별 `*.css` → `*.module.css` 교체

대상은 `App`, `Board`, `ChatWindow`, `ChatbotButton`, `BackButton`, `CommonPopup`, `MapButton`, `MapWindow`, `WaitingScreenInput`, `WaitingScreenMenu`, `NotifiedScreen`, `WaitingScreenPreview`, `MenuDisplay`, `WaitingPlaceMap`, `WaitingScreen`, `CancelledScreen` 총 17개 화면/컴포넌트. 기존 `*.css`는 삭제하고 동일한 이름의 `*.module.css`를 신설했다. JSX 쪽은 아래처럼 교체했다.

```jsx
// Before
import "./WaitingScreen.css";
<div className="preview-label">...</div>

// After
import styles from "./WaitingScreen.module.css";
<div className={styles["preview-label"]}>...</div>
```

단, `page-container` / `btn-primary` / `popup-*` 등 globals.css 쪽에 정의한 공통 클래스는 CSS Modules를 거치지 않고 기존처럼 순수 문자열(`className="popup-overlay"`)로 참조한다. **화면 고유 클래스는 Modules 경유, 여러 화면이 공유하는 클래스는 전역 문자열 참조**라는 2계층 구조가 된 것이다.

### 3. 베이스 스타일 합성

`NotifiedScreen` / `CancelledScreen` / `WaitingScreenInput` / `WaitingScreenMenu`는 `WaitingScreen.module.css`와 시각적으로 공통되는 레이아웃 클래스(`.preview-info-group` 등)를 가지고 있어서, 클래스 정의를 중복하지 않고 아래처럼 객체를 병합해서 쓴다.

```jsx
import baseStyles from "../waiting-screen/WaitingScreen.module.css";
import specificStyles from "./NotifiedScreen.module.css";
const styles = { ...baseStyles, ...specificStyles };
```

동일한 키가 양쪽에 존재하면 `specificStyles`가 우선 적용되는 점에 유의.

### 4. 공통 헤더바로의 레이아웃 변경

`ChatbotButton` / `MapButton` / `BackButton`은 기존에는 각 화면에 직접 배치되어 있었는데, 이번에 `page-top-bar` / `page-top-bar-left` / `page-top-bar-right`라는 공통 헤더바 구조로 감싸도록 통일했다 (WaitingScreen, WaitingScreenPreview, WaitingScreenMenu, WaitingScreenInput, NotifiedScreen, CancelledScreen).

또한 [`WaitingScreen.jsx`](../../src/containers/waiting-screen/waiting-screen/WaitingScreen.jsx)의 예약 취소 확인 팝업은 공통 `.popup-actions` 레이아웃에 맞춰 "닫기" 버튼을 명시적으로 하나 추가했다 (기존엔 우측 상단 × 아이콘만 있었음).

### 5. 부수적으로 함께 진행된 개선

- [`WaitingScreenMenu.jsx`](../../src/containers/waiting-screen/waiting-screen-menu/WaitingScreenMenu.jsx): 메뉴 조회 로직을 `useCallback` + `useRef`(`fetchedStoreIdRef`)로 변경해 동일 `storeId`에 대한 중복 API 호출을 방지. 실패 시에는 ref를 초기화해 재시도가 가능하도록 함.
- [`WaitingScreenContext.jsx`](../../src/containers/waiting-screen/WaitingScreenContext.jsx): 개발용 로그를 `NODE_ENV === 'development'` 가드로 감싸고, `setState` 호출 전에 값 변화 여부를 비교해 불필요한 리렌더링을 줄임.

## 검증

`CI=true npm run build`로 빌드 성공을 확인했다. gzip 이후 번들 크기는 변경 전과 동일한 수준 (순수한 스타일 레이어 교체이기 때문).

## 관련 문서

- 이번 리팩토링과 병행해서 발견·수정한 다국어 관련 버그는 [troubles/003-i18n-partial-breakage.md](../troubles/003-i18n-partial-breakage.ko.md) 참고.
