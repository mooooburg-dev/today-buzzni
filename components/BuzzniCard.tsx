import type { BuzzniResult } from '@/types';
import HeadlineCard from './HeadlineCard';
import WebtoonCard from './WebtoonCard';
import EmotionChart from './EmotionChart';

interface Props {
  result: BuzzniResult;
}

// 4가지 분석 결과를 신문지면처럼 하나로 묶는 컨테이너 카드
export default function BuzzniCard({ result }: Props) {
  return (
    <article className="mx-auto w-full max-w-3xl overflow-hidden rounded-md border border-stone-300 bg-[#f5f0e8] shadow-xl">
      {/* 1. 오늘의 헤드라인 */}
      <HeadlineCard
        headline={result.headline}
        subheadline={result.subheadline}
      />

      {/* 2. 4컷 웹툰 */}
      <WebtoonCard webtoon={result.webtoon} />

      {/* 3. 오늘의 속마음 한 줄 */}
      <section className="border-y border-stone-300 bg-stone-900 px-6 py-8 text-center">
        <p className="mb-2 text-xs tracking-widest text-stone-400 uppercase">
          오늘의 한 줄
        </p>
        <blockquote className="font-serif text-2xl leading-relaxed font-medium text-[#f5f0e8] italic">
          “{result.realThought}”
        </blockquote>
      </section>

      {/* 4. 감정지수 */}
      <EmotionChart emotions={result.emotions} />
    </article>
  );
}
