import { formatPrice } from '@/lib/format';
import type { Lang } from '@/lib/data';

interface PriceTagProps {
  min: number | null;
  max: number | null;
  lang: Lang;
  className?: string;
}

/**
 * Affiche un prix fence en USD (ou « non vendable »). Jamais de conversion.
 * Le bloc interne est en `dir="ltr"` pour garder l'ordre min → max
 * même dans une interface RTL, sans changer l'alignement du parent.
 */
export default function PriceTag({ min, max, lang, className = '' }: PriceTagProps) {
  if (min === null && max === null) {
    return <span className={className}>{formatPrice(null, lang)}</span>;
  }

  const low = min ?? max;
  const high = max ?? min;
  if (low === null || high === null) {
    return <span className={className}>{formatPrice(null, lang)}</span>;
  }

  if (low === high) {
    return (
      <span className={className}>
        <span dir="ltr">{formatPrice(low, lang)}</span>
      </span>
    );
  }

  return (
    <span className={className}>
      <span dir="ltr">
        {formatPrice(low, lang)} <span className="text-white/40">–</span> {formatPrice(high, lang)}
      </span>
    </span>
  );
}
