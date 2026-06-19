import { NextRequest, NextResponse } from "next/server";
import { fetchChannels, fetchTodayMessages } from "@/lib/slack";
import type { SlackApiResponse } from "@/types";

// Slack API는 Node 런타임에서 실행
export const runtime = "nodejs";
// 항상 최신 데이터를 가져오도록 캐시 비활성화
export const dynamic = "force-dynamic";

/**
 * GET /api/slack
 *   - (쿼리 없음)            → 채널 목록 반환
 *   - ?channel=<channelId>   → 해당 채널의 오늘 메시지 반환
 */
export async function GET(req: NextRequest): Promise<NextResponse<SlackApiResponse>> {
  try {
    const channelId = req.nextUrl.searchParams.get("channel");

    if (channelId) {
      const messages = await fetchTodayMessages(channelId);
      return NextResponse.json({ messages });
    }

    const channels = await fetchChannels();
    return NextResponse.json({ channels });
  } catch (err) {
    const message = err instanceof Error ? err.message : "슬랙 요청 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
