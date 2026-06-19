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
    <section className="border-y-4 border-double border-stone-800 bg-[#f5f0e8] px-6 py-8 text-center">
      {/* 신문 제호 영역 */}
      <div className="mb-4 flex items-center justify-between border-b border-stone-400 pb-2 text-xs tracking-widest text-stone-600 uppercase">
        <span>BUZZNI DAILY</span>
        <span>{today}</span>
        <span>제 1면</span>
      </div>

      {/* 헤드라인 */}
      <h1 className="font-serif text-4xl leading-tight font-black tracking-tight text-stone-900 md:text-5xl">
        {headline}
      </h1>

      {/* 부제목 */}
      {subheadline && (
        <p className="mt-4 border-t border-stone-300 pt-3 font-serif text-lg text-stone-700 italic">
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
