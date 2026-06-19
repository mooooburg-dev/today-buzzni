# 오늘의 버즈니 (Today's Buzzni)

> 슬랙에 흘려보낸 오늘의 희로애락, 그냥 스크롤로 사라지긴 아쉽잖아요.
> AI가 그 하루를 **사내 일간지 1면**으로 박제해 드립니다 — 헤드라인부터 4컷 만평, 감정지수까지. 📰

## ✨ 주요 기능

- **채널 선택** → 오늘의 스레드 자동 수집
- **AI 분석**으로 4가지 생성
  - 📰 오늘의 헤드라인 (신문 1면 스타일)
  - 🎨 4컷 만평 (장면 + 대사가 그려진 AI 이미지)
  - 💬 오늘의 한 줄 (사설)
  - 📊 감정지수 (억울함·유대감·현타·그래도내일은)
- **결과 캐싱** — 한 번 생성한 결과/이미지는 저장해 두고, 같은 날 같은 채널은 다시 불러옴

## 🛠 기술 스택

- **Next.js 16** (App Router) · TypeScript · Tailwind CSS v4
- **OpenAI** — 텍스트 분석(`gpt-4o-mini`) + 이미지 생성(`gpt-image`)
- **Supabase Storage** — 결과·이미지 캐싱
- **Slack Web API** (현재는 샘플 스레드 목업으로 동작)

## 🚀 실행

```bash
cp .env.local.example .env.local   # OPENAI/SUPABASE 키 입력
npm install
npm run dev                        # http://localhost:3020
```

> Slack 토큰을 비워두면 내장 샘플 스레드(목업)로 전체 흐름을 체험할 수 있습니다.

## 📁 구조

```
app/        페이지 · API 라우트(slack, generate)
components/ 신문 UI 카드(헤드라인 · 4컷 · 사설 · 감정지수)
lib/        slack · openai · supabase · mock
types/      공통 타입
```

자세한 설계는 [`CLAUDE.md`](./CLAUDE.md) 참고.
