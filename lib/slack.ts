import { WebClient } from "@slack/web-api";
import type { SlackChannel, SlackMessage } from "@/types";
import { MOCK_CHANNELS, getMockMessages, shouldUseMock } from "@/lib/mock";

// 환경변수에서 봇 토큰을 읽어 Slack WebClient 생성
function getClient(): WebClient {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    throw new Error("SLACK_BOT_TOKEN 환경변수가 설정되지 않았습니다.");
  }
  return new WebClient(token);
}

/**
 * 봇이 접근 가능한 공개/비공개 채널 목록을 가져온다.
 * (드롭다운에서 채널을 선택할 때 사용)
 */
export async function fetchChannels(): Promise<SlackChannel[]> {
  // 목업 모드: 실제 Slack을 호출하지 않고 더미 채널 반환
  if (shouldUseMock()) {
    return MOCK_CHANNELS;
  }

  const client = getClient();
  const channels: SlackChannel[] = [];
  let cursor: string | undefined;

  do {
    const res = await client.conversations.list({
      types: "public_channel,private_channel",
      exclude_archived: true,
      limit: 200,
      cursor,
    });

    for (const ch of res.channels ?? []) {
      if (ch.id && ch.name) {
        channels.push({ id: ch.id, name: ch.name });
      }
    }

    cursor = res.response_metadata?.next_cursor || undefined;
  } while (cursor);

  // 이름순 정렬
  return channels.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * 오늘(로컬 자정 ~ 현재) 올라온 채널 메시지를 가져온다.
 * 봇/시스템 메시지(서브타입 있는 메시지)는 제외하고,
 * 사용자 ID는 실명/표시이름으로 변환한다.
 */
export async function fetchTodayMessages(channelId: string): Promise<SlackMessage[]> {
  // 목업 모드: 실제 Slack을 호출하지 않고 채널별 샘플 스레드 반환
  if (shouldUseMock()) {
    return getMockMessages(channelId);
  }

  const client = getClient();

  // 오늘 0시(로컬 기준)의 유닉스 타임스탬프
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const oldest = (startOfDay.getTime() / 1000).toFixed(6);

  const messages: SlackMessage[] = [];
  let cursor: string | undefined;

  do {
    const res = await client.conversations.history({
      channel: channelId,
      oldest,
      limit: 200,
      cursor,
    });

    for (const msg of res.messages ?? []) {
      // 일반 사용자 메시지만 (subtype이 있으면 봇/조인/파일 등 시스템성 메시지)
      if (msg.subtype) continue;
      if (!msg.text || !msg.ts) continue;

      messages.push({
        user: msg.user ?? "unknown",
        text: msg.text,
        ts: msg.ts,
      });
    }

    cursor = res.response_metadata?.next_cursor || undefined;
  } while (cursor);

  // 시간 오름차순 정렬 (오래된 → 최신)
  messages.sort((a, b) => Number(a.ts) - Number(b.ts));

  // 사용자 ID → 표시 이름 변환 (중복 ID는 한 번만 조회)
  const userNameCache = new Map<string, string>();
  for (const msg of messages) {
    if (!userNameCache.has(msg.user)) {
      userNameCache.set(msg.user, await resolveUserName(client, msg.user));
    }
    msg.user = userNameCache.get(msg.user)!;
  }

  return messages;
}

// 사용자 ID를 표시 이름으로 변환 (실패 시 ID 그대로 사용)
async function resolveUserName(client: WebClient, userId: string): Promise<string> {
  if (userId === "unknown") return "알수없음";
  try {
    const res = await client.users.info({ user: userId });
    const profile = res.user?.profile;
    return (
      profile?.display_name ||
      profile?.real_name ||
      res.user?.name ||
      userId
    );
  } catch {
    return userId;
  }
}
