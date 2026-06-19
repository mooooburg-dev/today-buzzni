import OpenAI from "openai";
import type { BuzzniResult, SlackMessage, WebtoonCut } from "@/types";

// 텍스트 분석 모델 (슬랙 → 헤드라인/4컷구성/속마음/감정지수 JSON)
const TEXT_MODEL = process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini";

// 이미지 생성 모델. 기본은 확실히 존재하는 gpt-image-1.
// gpt-image-2 등을 쓰려면 .env.local 에 OPENAI_IMAGE_MODEL=gpt-image-2 설정.
const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY 환경변수가 설정되지 않았습니다.");
  }
  return new OpenAI({ apiKey });
}

// ──────────────────────────────────────────────
// 1) 텍스트 분석
// ──────────────────────────────────────────────

const SYSTEM_PROMPT = `당신은 사내 슬랙 채널의 하루치 대화를 읽고, 그날의 분위기를 "신문 1면 + 4컷 웹툰" 감성으로 재구성하는 사내 기자이자 만화가입니다.

직장인의 애환을 유쾌하고 공감되게, 약간의 풍자와 따뜻함을 섞어 표현하세요. 특정 개인을 비하하거나 민감한 정보를 노출하지 마세요.

반드시 아래 JSON 형태로만 응답하세요.

{
  "headline": "신문 1면 스타일 헤드라인",
  "subheadline": "부제목",
  "webtoon": [
    { "cut": 1, "scene": "장면 묘사", "dialog": "대사" },
    { "cut": 2, "scene": "장면 묘사", "dialog": "대사" },
    { "cut": 3, "scene": "장면 묘사", "dialog": "대사" },
    { "cut": 4, "scene": "장면 묘사", "dialog": "대사" }
  ],
  "realThought": "속마음 한 줄",
  "emotions": {
    "억울함": 0,
    "유대감": 0,
    "현타": 0,
    "그래도내일은": 0
  }
}

규칙:
- headline: 신문 1면 톱기사처럼 임팩트 있게.
- subheadline: 헤드라인을 보충하는 부제목 한 줄.
- webtoon: 정확히 4컷. 각 컷은 scene(장면 묘사)과 dialog(말풍선 대사)를 포함. 기승전결 흐름.
- realThought: 오늘 채널 구성원들의 집단 속마음을 한 줄로.
- emotions: 4개 항목의 값은 정수이며 모두 더하면 100이 되도록.`;

/**
 * 슬랙 메시지 배열을 받아 OpenAI로 분석하고 BuzzniResult를 반환한다.
 */
export async function analyzeMessages(messages: SlackMessage[]): Promise<BuzzniResult> {
  const client = getClient();

  const transcript = serializeThread(messages);
  const userPrompt = `다음은 오늘 사내 슬랙 채널에 올라온 대화입니다. [메인글]로 시작하는 본문에 [댓글]이 달린 하나의 스레드입니다. 이 대화를 분석해서 지정한 JSON 형식으로 "오늘의 버즈니"를 만들어 주세요.\n\n=== 오늘의 대화 ===\n${transcript}\n=== 대화 끝 ===`;

  const response = await client.chat.completions.create({
    model: TEXT_MODEL,
    max_tokens: 2048,
    // 순수 JSON으로 응답 강제
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
  });

  const raw = response.choices[0]?.message?.content?.trim() ?? "";
  return parseResult(raw);
}

// 메인 글 + 댓글(replies)을 사람이 읽는 스레드 형태로 직렬화
function serializeThread(messages: SlackMessage[]): string {
  const lines: string[] = [];
  for (const msg of messages) {
    lines.push(`[메인글] ${msg.user}: ${msg.text}`);
    for (const reply of msg.replies ?? []) {
      const indented = reply.text.split("\n").join("\n    ");
      lines.push(`  [댓글] ${reply.user}: ${indented}`);
    }
  }
  return lines.join("\n");
}

// 응답 문자열에서 JSON을 안전하게 파싱
function parseResult(raw: string): BuzzniResult {
  let jsonText = raw;

  const fenced = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) {
    jsonText = fenced[1].trim();
  } else {
    const start = jsonText.indexOf("{");
    const end = jsonText.lastIndexOf("}");
    if (start !== -1 && end !== -1) {
      jsonText = jsonText.slice(start, end + 1);
    }
  }

  let parsed: BuzzniResult;
  try {
    parsed = JSON.parse(jsonText) as BuzzniResult;
  } catch {
    throw new Error("OpenAI 응답을 JSON으로 파싱하지 못했습니다.");
  }

  return normalizeResult(parsed);
}

// 누락 필드 보정 및 감정지수 정규화
function normalizeResult(result: BuzzniResult): BuzzniResult {
  const webtoon = Array.isArray(result.webtoon) ? result.webtoon.slice(0, 4) : [];
  while (webtoon.length < 4) {
    webtoon.push({ cut: webtoon.length + 1, scene: "", dialog: "" });
  }
  webtoon.forEach((c, i) => (c.cut = i + 1));

  const e = result.emotions ?? { 억울함: 0, 유대감: 0, 현타: 0, 그래도내일은: 0 };
  const emotions = {
    억울함: Number(e.억울함) || 0,
    유대감: Number(e.유대감) || 0,
    현타: Number(e.현타) || 0,
    그래도내일은: Number(e.그래도내일은) || 0,
  };

  const sum = emotions.억울함 + emotions.유대감 + emotions.현타 + emotions.그래도내일은;
  if (sum > 0 && sum !== 100) {
    emotions.억울함 = Math.round((emotions.억울함 / sum) * 100);
    emotions.유대감 = Math.round((emotions.유대감 / sum) * 100);
    emotions.현타 = Math.round((emotions.현타 / sum) * 100);
    emotions.그래도내일은 = 100 - emotions.억울함 - emotions.유대감 - emotions.현타;
  }

  return {
    headline: result.headline ?? "오늘의 헤드라인을 만들지 못했습니다",
    subheadline: result.subheadline ?? "",
    webtoon,
    realThought: result.realThought ?? "",
    emotions,
  };
}

// ──────────────────────────────────────────────
// 2) 이미지 생성
// ──────────────────────────────────────────────

export function hasOpenAIKey(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

/**
 * 한 컷의 장면 묘사 + 대사를 받아, 대사 글자까지 포함된 만화 한 컷 이미지를 생성한다.
 * 반환값은 바로 <img src>에 쓸 수 있는 data URL.
 */
export async function generateCutImage(cut: WebtoonCut): Promise<string> {
  const client = getClient();

  const result = await client.images.generate({
    model: IMAGE_MODEL,
    prompt: buildImagePrompt(cut),
    size: "1024x1024",
    // 비용/속도 우선. 더 또렷한 결과가 필요하면 "medium" / "high"로.
    quality: "low",
    n: 1,
  });

  const b64 = result.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error("이미지 생성 결과가 비어 있습니다.");
  }
  return `data:image/png;base64,${b64}`;
}

// 컷 정보를 이미지 프롬프트로 변환 (대사를 말풍선 안에 한글로 그리도록 지시)
function buildImagePrompt(cut: WebtoonCut): string {
  const dialogPart = cut.dialog
    ? `이 장면에 어울리는 말풍선을 그리고, 말풍선 안에 다음 한국어 대사를 또렷하고 정확한 맞춤법으로 크게 적어줘: "${cut.dialog}"`
    : "대사 없이 장면만 표현해줘.";

  return [
    "한국 직장인의 사무실 일상을 그린 4컷 웹툰 중 한 컷.",
    "깔끔한 디지털 만화체, 부드러운 파스텔 색감, 단순한 배경, 과장된 표정.",
    `장면 묘사: ${cut.scene || "사무실 풍경"}`,
    dialogPart,
    "글자는 비뚤어지지 않게, 읽기 쉽고 선명하게.",
  ].join("\n");
}
