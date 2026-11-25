import { useTranslation } from 'react-i18next';
import ImageWithFallback from '@/components/ImageWithFallback';
import PriceTag from '@/components/PriceTag';
import RarityBadge from '@/components/RarityBadge';
import { localizedLabel } from '@/lib/data';
import type { Item, Lang } from '@/lib/data';

interface ItemCardProps {
  item: Item;
  lang: Lang;
  showCategory?: boolean;
}

export default function ItemCard({ item, lang, showCategory = true }: ItemCardProps) {
  const { t } = useTranslation();
  const category = showCategory ? localizedLabel(t, 'category', item.category) : null;

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] transition-colors hover:border-tunisian-sand/40">
      <div className="relative aspect-square bg-black/30">
        <ImageWithFallback
          src={item.image}
          alt={item.name}
          wrapperClassName="h-full w-full"
          imgClassName="h-full w-full object-contain p-3 transition-transform duration-200 group-hover:scale-105"
        />
        {item.rarity && (
          <div className="absolute start-2 top-2">
            <RarityBadge rarity={item.rarity} />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="text-sm font-semibold leading-snug text-white" title={item.name}>
          {item.name}
        </h3>
        {category && <p className="text-[11px] text-white/45">{category}</p>}
        <PriceTag
          min={item.priceMin}
          max={item.priceMax}
          lang={lang}
          className="mt-auto pt-2 text-sm font-semibold text-tunisian-sand"
        />
      </div>
    </article>
  );
}
