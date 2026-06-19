import { NextRequest, NextResponse } from "next/server";
import { fetchTodayMessages } from "@/lib/slack";
import { analyzeMessages, generateCutImage, hasOpenAIKey } from "@/lib/openai";
import {
  hasSupabase,
  todayKey,
  getCachedResult,
  saveResult,
  uploadCutImage,
} from "@/lib/supabase";
import type { GenerateApiResponse, SlackMessage } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// 텍스트 분석 + 이미지 4장 생성/업로드까지 처리하므로 넉넉히
export const maxDuration = 120;

/**
 * POST /api/generate
 * body: { channelId: string, messages?: SlackMessage[], force?: boolean }
 *   - force가 아니면 Supabase에 저장된 결과를 먼저 확인 (있으면 그대로 반환)
 *   - 없으면 분석 + 4컷 이미지 생성 후 Supabase에 저장하고 반환
 */
export async function POST(req: NextRequest): Promise<NextResponse<GenerateApiResponse>> {
  try {
    const body = (await req.json()) as {
      channelId?: string;
      messages?: SlackMessage[];
      force?: boolean;
    };

    const channelId = body.channelId;
    if (!channelId) {
      return NextResponse.json({ error: "channelId가 필요합니다." }, { status: 400 });
    }

    const date = todayKey();

    // 1) 캐시 조회 (force가 아니고 Supabase가 설정된 경우)
    if (!body.force && hasSupabase()) {
      const cached = await getCachedResult(channelId, date);
      if (cached) {
        return NextResponse.json({ result: cached, cached: true });
      }
    }

    // 2) 분석할 메시지 확보
    let messages = body.messages;
    if (!messages || messages.length === 0) {
      messages = await fetchTodayMessages(channelId);
    }
    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: "분석할 오늘의 메시지가 없습니다." },
        { status: 400 },
      );
    }

    // 3) 텍스트 분석
    const result = await analyzeMessages(messages);

    // 4) 4컷 이미지 생성 (OpenAI 키가 있을 때) → Supabase 업로드(설정 시)
    if (hasOpenAIKey()) {
      await Promise.all(
        result.webtoon.map(async (cut) => {
          try {
            const dataUrl = await generateCutImage(cut);
            cut.imageUrl = hasSupabase()
              ? await uploadCutImage(channelId, date, cut.cut, dataUrl)
              : dataUrl; // Supabase 없으면 data URL을 그대로 사용(저장은 안 됨)
          } catch {
            // 한 컷 실패는 무시 — 해당 컷은 텍스트 패널로 fallback
          }
        }),
      );
    }

    // 5) 결과 저장 (Supabase 설정 시)
    if (hasSupabase()) {
      await saveResult(channelId, date, result);
    }

    return NextResponse.json({ result, cached: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : "분석 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
