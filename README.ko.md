# 💻 Yoyaku Mate - 고객 대기 화면 (Web Client)

> **Yoyaku Mate**는 매장 예약 및 대기열을 실시간으로 관리하고 편리하게 대기할 수 있도록 지원하는 실시간 웨이팅 시스템입니다. 본 저장소는 고객이 스마트폰(모바일 웹)을 통해 대기 현황을 확인하고, 챗봇 및 지도를 활용할 수 있는 **사용자용 웹 클라이언트** 프로젝트입니다.

---

## 🛠 Tech Stack (기술 스택)

- **Frontend Core:** React 19, React Router DOM 7
- **HTTP Client:** Axios (API 비동기 통신)
- **Maps API:** `@react-google-maps/api` (구글 맵 매장 위치 정보 제공)
- **AI Chatbot:** Gemini API (대기 중 매장 정보 및 안내를 담당하는 AI 어시스턴트)
- **Utility:** `qrcode.react` (고객 고유 QR 코드 생성)
- **Deployment & Proxy:** Vercel (Edge Middleware Rewrites 활용)

---

## ✨ Key Features (핵심 기능)

- **실시간 대기열 상태 조회:** 내 대기 순서 및 예상 대기 시간을 실시간으로 확인합니다.
- **다국어 지원 (i18n):** 한국어, 일본어, 영어, 중국어, 태국어, 베트남어 등 다국어 지원으로 글로벌 고객 대응이 가능합니다.
- **매장 정보 및 지도 제공:** 구글 맵 API를 통해 매장의 정확한 위치를 파악하고 길을 찾을 수 있습니다.
- **AI 매장 가이드 챗봇:** Gemini AI 챗봇이 매장의 영업 시간, 화장실 위치, 메뉴 추천 등 대기 중인 고객의 다양한 질문에 답변합니다.
- **모바일 QR 티켓:** 현장 키오스크나 대기 보드에서 바로 확인 가능한 개인용 QR 티켓을 제공합니다.

---

## 📂 Project Structure (폴더 구조)

```bash
src/
├── api/                  # API 통신 정의 (Axios 인터셉터 및 대기열 서비스 호출)
├── components/           # 공통 UI 컴포넌트
├── containers/           # 페이지/컨테이너별 비즈니스 로직 및 화면
│   ├── board/            # 실시간 현황판 보드 화면
│   ├── chat-bot/         # Gemini 기반 AI 챗봇 화면
│   └── waiting-screen/   # 고객 대기 상세 화면 (지도, 메뉴 프리뷰, 알림 등)
├── data/                 # 정적 데이터 (국적 데이터 등)
├── hook/                 # 커스텀 React 훅
├── i18n/                 # 다국어 번역 리소스 파일들 (ko.json, ja.json 등)
├── styles/               # 전역 스타일 및 테마 정의
└── utils/                # 유틸리티 함수 모음
```

---

## 🚀 Getting Started (시작 가이드)

### 1. 환경 변수 설정
로컬 개발 환경 구성을 위해 프로젝트 루트 디렉토리에 `.env.development` 파일을 작성합니다.
*(API 키 및 민감 정보는 배포 환경 혹은 비공개 개발 환경 변수로 로컬에만 관리합니다.)*

```env
# 개발 환경 API 서버 주소
REACT_APP_API_URL=http://localhost:8080/api

# 구글 맵 API 키 (클라이언트 전용)
REACT_APP_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY

# Gemini AI 챗봇 API 키
REACT_APP_GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

### 2. 패키지 설치 및 실행
```bash
# 의존성 패키지 설치
npm install

# 로컬 개발 서버 실행
npm start
```
실행이 완료되면 브라우저에서 `http://localhost:3000` 주소로 접속할 수 있습니다.

---

## 🔒 Security & Deployment (배포 및 보안)

- **배포 플랫폼:** Vercel
- **API 프록시 설정 (`vercel.json`):**
  - 클라이언트 도메인과 API 도메인 간의 CORS 문제를 방지하고 보안을 높이기 위해 Vercel의 `rewrites` 설정을 통해 `/api` 요청을 백엔드 서버(`fly.dev`)로 리다이렉트합니다.
  ```json
  {
      "rewrites": [
          {
              "source": "/api/:match*",
              "destination": "https://rusui-prod.fly.dev/api/:match*"
          }
      ]
  }
  ```
