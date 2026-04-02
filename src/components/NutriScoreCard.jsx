const NUTRI_SCORE_BANDS = [
  {
    letter: 'A',
    min: 85,
    label: 'Higher nutritional quality',
    activeBg: 'bg-emerald-600',
    text: 'text-emerald-700',
    panel: 'bg-emerald-50 border-emerald-100',
  },
  {
    letter: 'B',
    min: 70,
    label: 'Good nutritional quality',
    activeBg: 'bg-lime-500',
    text: 'text-lime-700',
    panel: 'bg-lime-50 border-lime-100',
  },
  {
    letter: 'C',
    min: 55,
    label: 'Moderate nutritional quality',
    activeBg: 'bg-yellow-400',
    text: 'text-yellow-700',
    panel: 'bg-yellow-50 border-yellow-100',
  },
  {
    letter: 'D',
    min: 40,
    label: 'Below-average nutritional quality',
    activeBg: 'bg-orange-500',
    text: 'text-orange-700',
    panel: 'bg-orange-50 border-orange-100',
  },
  {
    letter: 'E',
    min: -Infinity,
    label: 'Lower nutritional quality',
    activeBg: 'bg-red-600',
    text: 'text-red-700',
    panel: 'bg-red-50 border-red-100',
  },
];

export const getNutriScoreMeta = (score) => {
  const safeScore = Number.isFinite(score) ? score : 0;
  return NUTRI_SCORE_BANDS.find((band) => safeScore >= band.min) || NUTRI_SCORE_BANDS[NUTRI_SCORE_BANDS.length - 1];
};

export default function NutriScoreCard({ score }) {
  const meta = getNutriScoreMeta(score);

  return (
    <div className={`rounded-3xl border p-5 shadow-sm ${meta.panel}`}>
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-gray-500">Nutri-Score</p>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-end gap-1 rounded-2xl bg-white p-3 shadow-sm">
          {NUTRI_SCORE_BANDS.map((band, index) => {
            const isActive = band.letter === meta.letter;
            const palette = ['bg-emerald-600', 'bg-lime-500', 'bg-yellow-400', 'bg-orange-500', 'bg-red-600'][index];
            return (
              <div
                key={band.letter}
                className={`flex h-12 w-9 items-center justify-center rounded-lg text-sm font-black text-white transition-all ${
                  isActive ? `${band.activeBg} scale-110 ring-4 ring-white shadow-lg` : `${palette} opacity-45`
                }`}
              >
                {band.letter}
              </div>
            );
          })}
        </div>
        <div>
          <p className={`text-2xl font-bold ${meta.text}`}>Nutri-Score {meta.letter}</p>
          <p className="mt-1 text-sm text-gray-700">{meta.label}</p>
        </div>
      </div>
    </div>
  );
}
