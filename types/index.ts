// 오늘의 버즈니 공통 타입 정의

// 슬랙 채널
export interface SlackChannel {
  id: string;
  name: string;
}

// 슬랙 메시지 (가공된 형태)
// 메인 글이 댓글을 가지면 replies에 담긴다 (스레드 1세트)
export interface SlackMessage {
  user: string;
  text: string;
  ts: string;
  replies?: SlackMessage[];
}

// 4컷 웹툰의 한 컷
export interface WebtoonCut {
  cut: number;
  scene: string; // 장면 묘사
  dialog: string; // 대사
  imageUrl?: string; // 생성/저장된 이미지 URL (Supabase public URL 또는 data URL)
}

// 감정지수 (각 항목 0~100 %)
export interface Emotions {
  억울함: number;
  유대감: number;
  현타: number;
  그래도내일은: number;
}

// Claude 분석 결과 (API 응답 JSON 스키마와 1:1 매칭)
export interface BuzzniResult {
  headline: string; // 신문 1면 스타일 헤드라인
  subheadline: string; // 부제목
  webtoon: WebtoonCut[]; // 4컷 웹툰
  realThought: string; // 오늘의 속마음 한 줄
  emotions: Emotions; // 감정지수
}

// /api/slack 응답
export interface SlackApiResponse {
  channels?: SlackChannel[];
  messages?: SlackMessage[];
  error?: string;
}

// /api/generate 응답
export interface GenerateApiResponse {
  result?: BuzzniResult;
  cached?: boolean; // true면 Supabase에 저장돼 있던 결과를 불러온 것
  error?: string;
}

// 감정지수 항목 메타 (UI 컬러 매핑용)
export const EMOTION_META: { key: keyof Emotions; label: string; color: string }[] = [
  { key: "억울함", label: "억울함", color: "#d9534f" },
  { key: "유대감", label: "유대감", color: "#5cb85c" },
  { key: "현타", label: "현타", color: "#5bc0de" },
  { key: "그래도내일은", label: "그래도 내일은", color: "#f0ad4e" },
];
