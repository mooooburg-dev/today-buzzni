import { EMOTION_META, type Emotions } from "@/types";

interface Props {
  emotions: Emotions;
}

// 감정지수 컬러 프로그레스바 차트
export default function EmotionChart({ emotions }: Props) {
  return (
    <section className="bg-[#f5f0e8] px-6 py-6">
      <h2 className="mb-4 text-center font-serif text-2xl font-bold text-stone-900">
        오늘의 감정지수
      </h2>

      <div className="mx-auto flex max-w-md flex-col gap-4">
        {EMOTION_META.map(({ key, label, color }) => {
          const value = Math.max(0, Math.min(100, emotions[key] ?? 0));
          return (
            <div key={key}>
              <div className="mb-1 flex items-center justify-between text-sm font-medium text-stone-700">
                <span>{label}</span>
                <span className="tabular-nums">{value}%</span>
              </div>
              <div className="h-4 w-full overflow-hidden rounded-full border border-stone-300 bg-stone-200">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${value}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
