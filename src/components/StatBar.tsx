interface StatBarProps {
  label: string;
  value: number | null;
  max: number;
  colorClass: string;
  suffix?: string;
}

export default function StatBar({ label, value, max, colorClass, suffix = '' }: StatBarProps) {
  const width = value !== null && max > 0 ? Math.max(2, Math.min(100, (value / max) * 100)) : 0;

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2 text-[11px]">
        <span className="text-white/50">{label}</span>
        <span className="font-semibold text-white/90">
          {value === null ? '—' : `${value}${suffix}`}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}
