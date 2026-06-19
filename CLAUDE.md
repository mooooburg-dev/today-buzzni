# 오늘의 버즈니 (Today's Buzzni)

슬랙 채널의 오늘 메시지를 수집하고, Claude API로 분석해 사내 웹툰/뉴스 카드 형태로 보여주는 웹 서비스.

> ⚠️ 이 프로젝트는 `create-next-app@latest`로 생성되어 **Next.js 16 + React 19 + Tailwind v4**를 사용합니다.
> (요청서의 Next.js 14와 다름) 코드 작성 전 `node_modules/next/dist/docs/`의 관련 가이드를 확인하세요. `@AGENTS.md` 참고.

## 기술 스택

- Next.js 16 (App Router) / React 19
- TypeScript
- Tailwind CSS v4 (`@import "tailwindcss"`, `tailwind.config` 없음 / `@theme`로 토큰 정의)
- @slack/web-api
- openai (텍스트 분석 `gpt-4o-mini` + 4컷 이미지 `gpt-image-*` 통합)
- @supabase/supabase-js (결과·이미지 캐싱: Storage 버킷 `buzzni`)

## 프로젝트 구조

```
today-buzzni/
├── app/
│   ├── page.tsx              # 메인 화면 (채널 선택 → 수집 → 생성 → 카드 표시)
│   ├── layout.tsx            # 한글 폰트(Noto Sans/Serif KR) 주입
│   ├── globals.css           # Tailwind v4 + 신문지 배경 톤
│   └── api/
│       ├── slack/route.ts    # GET: 채널 목록 / 오늘 메시지 fetch
│       └── generate/route.ts # POST: 캐시조회 → (미스 시) 분석+이미지생성+저장
├── components/
│   ├── BuzzniCard.tsx        # 4가지 결과를 묶는 신문 지면 컨테이너
│   ├── HeadlineCard.tsx      # 신문 1면 헤드라인
│   ├── WebtoonCard.tsx       # 4컷 웹툰 (imageUrl 있으면 그림, 없으면 텍스트 fallback)
│   └── EmotionChart.tsx      # 감정지수 컬러 프로그레스바
├── lib/
│   ├── slack.ts              # 채널/메시지 조회, 사용자 ID→이름 변환
│   ├── mock.ts               # 토큰 없을 때 쓰는 샘플 스레드/채널
│   ├── openai.ts             # 텍스트 분석(analyzeMessages) + 이미지 생성(generateCutImage)
│   └── supabase.ts           # 결과/이미지 캐싱(getCachedResult/saveResult/uploadCutImage)
├── types/index.ts            # 공통 타입 (BuzzniResult 등)
└── .env.local.example
```

## 실행

1. `cp .env.local.example .env.local` 후 토큰 입력
2. `npm run dev` → http://localhost:3100 (기본 포트 3100 고정)

## 주요 흐름

1. 진입 시 `/api/slack`으로 봇이 속한 채널 목록 로드
2. 채널 선택 → "오늘 메시지 수집"(`/api/slack?channel=`) 또는 바로 "생성"
3. `/api/generate`가 오늘 메시지를 Claude로 분석 → 헤드라인/4컷웹툰/속마음/감정지수 JSON 생성
4. `BuzzniCard`로 카드 UI 렌더링

## 분석 결과 스키마 (`types/BuzzniResult`)

`headline`, `subheadline`, `webtoon[4]{cut,scene,dialog}`, `realThought`, `emotions{억울함,유대감,현타,그래도내일은}` (합계 100으로 정규화)

## 컨벤션

- 응답·주석·커밋 메시지는 한국어로 작성.
- 경로 alias `@/*` → 프로젝트 루트.
- 비밀키는 서버(route handler/lib)에서만 사용. 클라이언트로 노출 금지.
