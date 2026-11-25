import { useTranslation } from 'react-i18next';
import type { Rarity } from '@/lib/data';

const STYLES: Record<Rarity, string> = {
  common: 'border-slate-400/30 bg-slate-400/10 text-slate-200',
  uncommon: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
  rare: 'border-sky-400/30 bg-sky-400/10 text-sky-200',
  epic: 'border-violet-400/30 bg-violet-400/10 text-violet-200',
  legendary: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
  exotic: 'border-rose-400/30 bg-rose-400/10 text-rose-200',
};

export default function RarityBadge({ rarity }: { rarity: Rarity | null }) {
  const { t } = useTranslation();
  if (!rarity) return null;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STYLES[rarity]}`}
    >
      {t(`rarity.${rarity}`)}
    </span>
  );
}
