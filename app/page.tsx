'use client';

import { useEffect, useState } from 'react';
import BuzzniCard from '@/components/BuzzniCard';
import type {
  BuzzniResult,
  SlackApiResponse,
  GenerateApiResponse,
  SlackChannel,
  SlackMessage,
} from '@/types';

// 메인 글 + 댓글을 모두 더한 총 메시지 수
function countMessages(messages: SlackMessage[]): number {
  return messages.reduce((n, m) => n + 1 + (m.replies?.length ?? 0), 0);
}

export default function Home() {
  const [channels, setChannels] = useState<SlackChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [messages, setMessages] = useState<SlackMessage[]>([]);
  const [result, setResult] = useState<BuzzniResult | null>(null);

  const [loadingChannels, setLoadingChannels] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [cached, setCached] = useState(false);
  const [error, setError] = useState('');

  // 최초 진입 시 채널 목록 로드
  useEffect(() => {
    void loadChannels();
  }, []);

  async function loadChannels() {
    setLoadingChannels(true);
    setError('');
    try {
      const res = await fetch('/api/slack');
      const data: SlackApiResponse = await res.json();
      if (data.error) throw new Error(data.error);
      setChannels(data.channels ?? []);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : '채널 목록을 불러오지 못했습니다.',
      );
    } finally {
      setLoadingChannels(false);
    }
  }

  // 선택한 채널의 오늘 메시지 fetch
  async function handleFetchMessages() {
    if (!selectedChannel) return;
    setFetching(true);
    setError('');
    setMessages([]);
    setResult(null);
    try {
      const res = await fetch(
        `/api/slack?channel=${encodeURIComponent(selectedChannel)}`,
      );
      const data: SlackApiResponse = await res.json();
      if (data.error) throw new Error(data.error);
      setMessages(data.messages ?? []);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : '메시지를 불러오지 못했습니다.',
      );
    } finally {
      setFetching(false);
    }
  }

  // 오늘의 버즈니 생성 (force=true면 캐시 무시하고 새로 생성)
  async function handleGenerate(force = false) {
    if (!selectedChannel) return;
    setGenerating(true);
    setError('');
    setResult(null);
    setCached(false);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: selectedChannel,
          messages: messages.length > 0 ? messages : undefined,
          force,
        }),
      });
      const data: GenerateApiResponse = await res.json();
      if (data.error) throw new Error(data.error);

      // 캐시(DB)에서 즉시 불러온 경우에도 생성하는 것처럼 5~10초 로딩 연출
      if (data.cached) {
        const delay = 5000 + Math.random() * 5000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      setResult(data.result ?? null);
      setCached(Boolean(data.cached));
    } catch (e) {
      setError(e instanceof Error ? e.message : '생성 중 오류가 발생했습니다.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#ece5d8] px-4 py-10">
      <div className="mx-auto max-w-3xl">
        {/* 헤더 */}
        <header className="mb-8 text-center">
          <h1 className="font-serif text-5xl font-black tracking-tight text-stone-900">
            오늘의 버즈니
          </h1>
        </header>

        {/* 컨트롤 패널 */}
        <section className="mb-8 rounded-lg border border-stone-300 bg-[#f5f0e8] p-5 shadow-sm">
          <label className="mb-2 block text-sm font-medium text-stone-700">
            채널 선택
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              disabled={loadingChannels}
              className="flex-1 rounded-md border border-stone-400 bg-white px-3 py-2 text-stone-800 focus:border-stone-600 focus:outline-none disabled:opacity-60"
            >
              <option value="">
                {loadingChannels ? '채널 불러오는 중...' : '채널을 선택하세요'}
              </option>
              {channels.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  # {ch.name}
                </option>
              ))}
            </select>

            <button
              onClick={handleFetchMessages}
              disabled={!selectedChannel || fetching}
              className="rounded-md border border-stone-700 bg-stone-100 px-4 py-2 font-medium text-stone-800 transition hover:bg-stone-200 disabled:opacity-50"
            >
              {fetching ? '수집 중...' : '오늘 메시지 수집'}
            </button>

            <button
              onClick={() => handleGenerate(false)}
              disabled={!selectedChannel || generating}
              className="rounded-md bg-stone-900 px-4 py-2 font-medium text-[#f5f0e8] transition hover:bg-stone-700 disabled:opacity-50"
            >
              {generating ? '생성 중...' : '오늘의 버즈니 생성'}
            </button>
          </div>

          {/* 수집된 메시지 요약 */}
          {messages.length > 0 && (
            <p className="mt-3 text-sm text-stone-600">
              오늘 메시지 <strong>{countMessages(messages)}</strong>건 수집됨
              (메인 글 {messages.length} · 댓글{' '}
              {countMessages(messages) - messages.length}) — 바로 생성하거나
              아래에서 미리 볼 수 있어요.
            </p>
          )}

          {/* 에러 */}
          {error && (
            <p className="mt-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              ⚠️ {error}
              {channels.length === 0 && (
                <button
                  onClick={loadChannels}
                  className="ml-2 underline hover:no-underline"
                >
                  다시 시도
                </button>
              )}
            </p>
          )}
        </section>

        {/* 생성 중 로딩 */}
        {generating && (
          <div className="mb-8 animate-pulse rounded-lg border border-stone-300 bg-[#f5f0e8] p-10 text-center text-stone-500">
            오늘의 신문을 편집하고 그림을 그리는 중이에요…
          </div>
        )}

        {/* 결과 카드 */}
        {result && !generating && (
          <>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-stone-500">
                {cached ? '💾 저장된 결과를 불러왔어요' : '✨ 새로 생성했어요'}
              </span>
              <button
                onClick={() => handleGenerate(true)}
                className="rounded-md border border-stone-400 bg-stone-100 px-3 py-1.5 text-sm font-medium text-stone-700 transition hover:bg-stone-200"
              >
                다시 생성
              </button>
            </div>
            <BuzzniCard result={result} />
          </>
        )}

        {/* 수집된 원본 메시지 미리보기 (결과 없을 때만) */}
        {!result && messages.length > 0 && (
          <details className="rounded-lg border border-stone-300 bg-[#f5f0e8] p-4">
            <summary className="cursor-pointer text-sm font-medium text-stone-700">
              수집된 메시지 미리보기 ({messages.length}건)
            </summary>
            <ul className="mt-3 max-h-80 space-y-3 overflow-y-auto text-sm text-stone-700">
              {messages.map((m, i) => (
                <li key={i} className="border-b border-stone-200 pb-2">
                  {/* 메인 글 */}
                  <p className="whitespace-pre-wrap">
                    <span className="font-semibold">{m.user}</span>: {m.text}
                  </p>
                  {/* 댓글 (스레드) */}
                  {m.replies && m.replies.length > 0 && (
                    <ul className="mt-2 space-y-2 border-l-2 border-stone-300 pl-3">
                      {m.replies.map((r, j) => (
                        <li
                          key={j}
                          className="whitespace-pre-wrap text-stone-600"
                        >
                          <span className="font-semibold">↳ {r.user}</span>:{' '}
                          {r.text}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </main>
  );
}
