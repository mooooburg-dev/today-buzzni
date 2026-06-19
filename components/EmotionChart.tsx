import { EMOTION_META, type Emotions } from "@/types";

interface Props {
  emotions: Emotions;
}

// 감정지수 컬러 프로그레스바 차트
export default function EmotionChart({ emotions }: Props) {
  return (
    <section className="bg-[#f5f0e8] px-6 py-6">
      <div className="mb-4 text-center">
        <p className="kicker text-[10px] text-stone-500">독자 여론조사</p>
        <h2 className="font-masthead text-2xl font-bold text-stone-900">
          오늘의 감정지수
        </h2>
      </div>

      <div className="mx-auto max-w-md border border-stone-800 bg-white/60 p-5">
        <div className="flex flex-col gap-4">
          {EMOTION_META.map(({ key, label, color }) => {
            const value = Math.max(0, Math.min(100, emotions[key] ?? 0));
            return (
              <div key={key}>
                <div className="mb-1 flex items-baseline justify-between text-sm text-stone-800">
                  <span className="font-serif font-medium">{label}</span>
                  <span className="font-masthead text-lg font-black tabular-nums">
                    {value}
                    <span className="text-xs">%</span>
                  </span>
                </div>
                {/* 각진 막대 (신문 인쇄물 느낌) */}
                <div className="h-3.5 w-full overflow-hidden border border-stone-800 bg-stone-100">
                  <div
                    className="h-full transition-all duration-700 ease-out"
                    style={{ width: `${value}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <p className="kicker mt-4 border-t border-stone-300 pt-2 text-center text-[9px] text-stone-400">
          표본 1면 · 오차범위 ±오늘의기분
        </p>
      </div>
    </section>
  );
}
