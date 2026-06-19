import type { BuzzniResult } from "@/types";

interface Props {
  headline: string;
  subheadline: string;
}

// 신문 1면 스타일 헤드라인 카드
export default function HeadlineCard({ headline, subheadline }: Props) {
  // 오늘 날짜 (한국어 표기)
  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <section className="border-b-4 border-double border-stone-800 bg-[#f5f0e8] px-6 py-8 text-center">
      {/* 면 표기 */}
      <div className="kicker mb-3 flex items-center justify-between border-b border-stone-400 pb-2 text-[10px] text-stone-500">
        <span>제1면 · 종합</span>
        <span>{today}</span>
        <span>독점 보도</span>
      </div>

      {/* 키커 (특종 라벨) */}
      <div className="mb-3 flex justify-center">
        <span className="kicker inline-block bg-stone-900 px-3 py-1 text-[10px] font-bold text-[#f5f0e8]">
          오늘의 특종
        </span>
      </div>

      {/* 헤드라인 */}
      <h1 className="font-masthead text-4xl leading-[1.15] font-black text-stone-900 md:text-5xl">
        {headline}
      </h1>

      {/* 부제목 (deck) */}
      {subheadline && (
        <p className="mx-auto mt-4 max-w-xl border-t border-stone-300 pt-3 font-serif text-lg text-stone-700 italic">
          {subheadline}
        </p>
      )}
    </section>
  );
}

// 편의상 result 전체를 받는 변형도 export
export function HeadlineCardFromResult({ result }: { result: BuzzniResult }) {
  return <HeadlineCard headline={result.headline} subheadline={result.subheadline} />;
}
