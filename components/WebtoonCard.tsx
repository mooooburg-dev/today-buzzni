import type { WebtoonCut } from '@/types';

interface Props {
  webtoon: WebtoonCut[];
}

// 4컷 웹툰 카드
// 이미지(imageUrl)는 서버(/api/generate)에서 생성/저장되어 결과에 담겨 온다.
// 이미지가 있으면 그림을, 없으면 텍스트 패널(장면+말풍선)을 표시한다.
export default function WebtoonCard({ webtoon }: Props) {
  return (
    <section className="bg-[#f5f0e8] px-2 py-6">
      <h2 className="mb-4 text-center font-serif text-2xl font-bold text-stone-900">
        오늘의 4컷 웹툰
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {webtoon.map((cut) => (
          <article
            key={cut.cut}
            className="relative flex min-h-[220px] flex-col overflow-hidden rounded-sm border-2 border-stone-800 bg-white shadow-[4px_4px_0_0_rgba(41,37,36,1)]"
          >
            {/* 컷 번호 */}
            <span className="absolute -top-3 -left-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-stone-800 bg-yellow-300 text-sm font-bold text-stone-900">
              {cut.cut}
            </span>

            {cut.imageUrl ? (
              // 생성된 이미지 (대사 포함)
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cut.imageUrl}
                alt={`${cut.cut}컷: ${cut.scene}`}
                className="aspect-square w-full object-cover"
              />
            ) : (
              // 이미지 없을 때 텍스트 패널 fallback (장면 묘사 + 말풍선 대사)
              <div className="flex flex-1 flex-col justify-between p-4">
                <p className="mb-3 border-b border-dashed border-stone-300 pb-3 text-sm leading-relaxed text-stone-500 italic">
                  {cut.scene || '—'}
                </p>
                {cut.dialog ? (
                  <div className="relative self-start rounded-2xl border-2 border-stone-800 bg-stone-50 px-4 py-2 text-stone-900">
                    <span className="text-base leading-snug font-medium">
                      {cut.dialog}
                    </span>
                    <span className="absolute -bottom-2 left-6 h-3 w-3 rotate-45 border-r-2 border-b-2 border-stone-800 bg-stone-50" />
                  </div>
                ) : (
                  <div className="text-sm text-stone-300">…</div>
                )}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
