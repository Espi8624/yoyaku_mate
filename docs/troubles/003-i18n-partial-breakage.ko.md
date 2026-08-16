# 다국어 지원이 부분적으로 무력화되어 있던 문제

> 작성일: 2026-08-16  
> 관련 파일: [`src/data/nationalities.json`](../../src/data/nationalities.json), [`src/hook/useTranslation.js`](../../src/hook/useTranslation.js), [`src/i18n/*.json`](../../src/i18n), [`WaitingScreenContext.jsx`](../../src/containers/waiting-screen/WaitingScreenContext.jsx), [`WaitingScreenPreview.jsx`](../../src/containers/waiting-screen/waiting-screen-preview/WaitingScreenPreview.jsx)

## 문제 개요

CSS Modules 리팩토링 ([refactoring/001](../refactoring/001-css-modules-migration.ko.md)) 작업 도중, 분명히 여러 언어로 번역되어 있어야 할 `src/i18n/*.json` (ja/en/ko/fr/de/ru/vi/th/zh/id/ar/es/it/pt 14개 언어)이 실제로는 일본어·한국어·프랑스어·영어 사용자를 제외하고는 거의 전달되지 않고 있었다는 사실이 드러났다. 원인은 하나가 아니라, 서로 독립된 4가지 버그가 겹쳐서 다국어 지원을 무력화하고 있었다.

---

## 원인 분석

### 1. 국적→언어코드 매핑 테이블이 거의 전멸 상태 (가장 큰 원인)

고객의 언어는 [`WaitingScreenContext.jsx`](../../src/containers/waiting-screen/WaitingScreenContext.jsx)의 `getNationalityFromLanguage()`가 브라우저 지역 정보로 국가명을 얻은 뒤, [`nationalities.json`](../../src/data/nationalities.json)에서 해당 국가의 `languageCode`를 반환하는 방식으로 결정된다.

그런데 `nationalities.json`을 조사해보니 200개국 중 **196개국이 `languageCode: "en"`으로 고정**되어 있었다. `de.json` / `ru.json` / `vi.json` / `th.json` / `zh.json` / `id.json` / `ar.json` 등은 번역이 이미 완비되어 있었음에도, 거기에 도달하는 경로 자체가 없었던 것이다.

```json
// 수정 전 (독일 예시)
{ "name": "Germany", "languageCode": "en" }

// 수정 후
{ "name": "Germany", "languageCode": "de" }
```

주요 61개국(독일어권, 러시아어권, 중국어권, 스페인어권 21개국, 아랍어권 21개국 등)의 `languageCode`를 실제 존재하는 번역 파일에 맞게 수정했다.

### 2. es / it / pt가 번역 훅에 연결되어 있지 않음

[`useTranslation.js`](../../src/hook/useTranslation.js)의 `translations` 객체에 `es` / `it` / `pt`가 아예 import조차 되어 있지 않았다. 번역 파일 자체는 완성돼 있었지만, 코드상 도달 불가능한 상태(죽은 파일)였다.

```javascript
// 수정 전
const translations = { ja, en, ko, fr, de, ru, vi, th, zh, id, ar };

// 수정 후
const translations = { ja, en, ko, fr, de, ru, vi, th, zh, id, ar, es, it, pt };
```

### 3. 번역 키 누락 (`ja.json`에만 존재하는 키)

`waiting_screen_input.party_size_placeholder` / `contact_placeholder` / `note_placeholder`, `waiting_screen_notified.title/message`, `waiting_screen_preview.pre_order` 등이 `ja.json`에만 있고 나머지 13개 언어에는 없었다. 폴백 처리가 없는 컴포넌트에서는 값이 `undefined`가 되어, 입력창 placeholder가 빈 채로 표시되는 문제로 이어졌다.

반대로 `waiting_screen_preview.popup.{close,back,confirm}`는 **`ja.json`에만 없고** 나머지 13개 언어에는 갖춰져 있었다. 이는 [`CongestionPopup.jsx`](../../src/containers/waiting-screen/waiting-screen-preview/CongestionPopup.jsx)에서 실제로 쓰이는 키라서, 정작 일본어 사용자가 팝업의 "뒤로/확정/닫기" 버튼에서 빈 텍스트를 보고 있었던 셈이다. 14개 언어의 키 구성을 전부 대조해서 92개 키로 통일했다.

### 4. i18n 시스템을 우회한 하드코딩

[`WaitingScreenPreview.jsx`](../../src/containers/waiting-screen/waiting-screen-preview/WaitingScreenPreview.jsx)와 [`WaitingScreenContext.jsx`](../../src/containers/waiting-screen/WaitingScreenContext.jsx)의 일부 팝업 문구가 `t.xxx` 참조 대신 다음과 같은 삼항 연산자로 직접 작성되어 있었다.

```jsx
// 수정 전
{selectedLanguageCode === 'ja' ? 'この内容で登録を進めてもよろしいですか？' : 'Is it okay to proceed with this content?'}
```

이는 일본어/영어 둘 중 하나만 고려한 것이라, 나머지 12개 언어 사용자는 항상 영어로 보고 있었다. 새 키(`waiting_screen_preview.submit_confirm`, `waiting_screen.registration_complete_popup`, `waiting_screen.completed_notification_popup`)를 전 14개 언어에 추가하고 `t.xxx` 참조로 되돌렸다.

---

## 해결 내용 정리

| 대응 | 내용 |
|---|---|
| `nationalities.json` | 61개국의 `languageCode`를 실제 구현된 번역 파일에 맞게 수정 |
| `useTranslation.js` | `es` / `it` / `pt`의 import 및 `translations` 객체 등록 추가 |
| `i18n/*.json` (14개 파일) | 누락 키 보완, 전 언어 92개 키로 통일. 미사용 고아 키(`waiting_screen_preview.name_label`) 제거 |
| `WaitingScreenPreview.jsx` / `WaitingScreenContext.jsx` | 하드코딩된 삼항 연산자 3곳을 `t.xxx` 참조로 교체 |

## 검증

- 14개 언어 파일의 키 집합이 완전히 일치하는지 스크립트로 확인 (missing/extra 각 0건)
- `CI=true npm run build`로 빌드 성공 확인

---

## Lessons Learned

- **번역 파일이 존재한다고 해서 동작하는 것은 아니다.** 실제로 그 파일까지 도달하는 경로(import 등록, 매핑 테이블, 키 참조)까지 함께 검증하지 않으면 번역 작업 자체가 죽은 코드가 될 수 있다.
- 다국어 지원의 키 누락은 `ja.json`을 기준으로 한 **전 언어 키 집합 비교 스크립트**로 기계적으로 검출할 수 있다. 앞으로 번역 키를 추가·변경할 때는 반드시 14개 언어 파일 전체 반영을 세트로 진행할 것.
- "지원 언어가 2개뿐"이라고 가정한 삼항 연산자(`lang === 'ja' ? A : B`)는 다국어 시스템이 도입된 화면에서는 원칙적으로 금지하고, 반드시 `useTranslation` 경유 참조로 작성할 것.
