const DIET_META = {
  Veg: {
    label: 'Veg',
    dot: 'bg-green-600',
    ring: 'border-green-600',
    text: 'text-green-700',
    panel: 'bg-green-50 border-green-100',
  },
  'Non-Veg': {
    label: 'Non-Veg',
    dot: 'bg-red-600',
    ring: 'border-red-600',
    text: 'text-red-700',
    panel: 'bg-red-50 border-red-100',
  },
  Unknown: {
    label: 'Unknown',
    dot: 'bg-amber-500',
    ring: 'border-amber-500',
    text: 'text-amber-700',
    panel: 'bg-amber-50 border-amber-100',
  },
};

export const getDietIndicatorMeta = (label) => DIET_META[label] || DIET_META.Unknown;

export default function DietTypeIndicator({ label, reason, compact = false }) {
  const meta = getDietIndicatorMeta(label);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className={`inline-flex h-5 w-5 items-center justify-center rounded-sm border-2 bg-white ${meta.ring}`}>
          <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
        </span>
        <span className={`text-sm font-semibold ${meta.text}`}>{meta.label}</span>
      </div>
    );
  }

  return (
    <div className={`rounded-3xl border p-5 shadow-sm ${meta.panel}`}>
      <div className="flex items-center gap-3">
        <span className={`inline-flex h-7 w-7 items-center justify-center rounded-md border-2 bg-white ${meta.ring}`}>
          <span className={`h-3.5 w-3.5 rounded-full ${meta.dot}`} />
        </span>
        <div>
          <p className={`text-2xl font-bold ${meta.text}`}>{meta.label}</p>
          {reason ? <p className="mt-1 text-sm text-gray-600">{reason}</p> : null}
        </div>
      </div>
    </div>
  );
}
