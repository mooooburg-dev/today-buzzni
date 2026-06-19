import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { BuzzniResult } from "@/types";

// 결과/이미지를 저장할 버킷 이름 (없으면 buzzni)
const BUCKET = process.env.SUPABASE_BUCKET || "buzzni";

// SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_URL 둘 다 허용
function supabaseUrl(): string | undefined {
  return process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
}

// Supabase 설정 여부 (없으면 캐싱 없이 매번 생성)
export function hasSupabase(): boolean {
  return !!(supabaseUrl() && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

let client: SupabaseClient | null = null;
function getClient(): SupabaseClient {
  if (!client) {
    const url = supabaseUrl()!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    client = createClient(url, key, {
      auth: { persistSession: false },
    });
  }
  return client;
}

// 오늘 날짜 (YYYY-MM-DD, 로컬 기준) — 캐시 키에 사용
export function todayKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// 결과 JSON 저장 경로
function resultPath(channelId: string, date: string): string {
  return `results/${channelId}/${date}.json`;
}

// 컷 이미지 저장 경로
function imagePath(channelId: string, date: string, cut: number): string {
  return `images/${channelId}/${date}/cut${cut}.png`;
}

/**
 * 저장된 결과를 불러온다. 없으면 null.
 */
export async function getCachedResult(
  channelId: string,
  date: string,
): Promise<BuzzniResult | null> {
  const supabase = getClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .download(resultPath(channelId, date));

  if (error || !data) return null;

  try {
    const text = await data.text();
    return JSON.parse(text) as BuzzniResult;
  } catch {
    return null;
  }
}

/**
 * 결과 JSON을 저장(upsert)한다.
 */
export async function saveResult(
  channelId: string,
  date: string,
  result: BuzzniResult,
): Promise<void> {
  const supabase = getClient();
  const body = new Blob([JSON.stringify(result)], { type: "application/json" });
  await supabase.storage
    .from(BUCKET)
    .upload(resultPath(channelId, date), body, {
      contentType: "application/json",
      upsert: true,
    });
}

/**
 * 컷 이미지(data URL)를 Storage에 업로드하고 public URL을 반환한다.
 */
export async function uploadCutImage(
  channelId: string,
  date: string,
  cut: number,
  dataUrl: string,
): Promise<string> {
  const supabase = getClient();

  // "data:image/png;base64,XXXX" → 바이너리
  const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
  const bytes = Buffer.from(base64, "base64");
  const path = imagePath(channelId, date, cut);

  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType: "image/png",
    upsert: true,
  });
  if (error) {
    throw new Error(`이미지 업로드 실패: ${error.message}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
