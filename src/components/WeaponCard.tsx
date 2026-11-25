import { useTranslation } from 'react-i18next';
import ImageWithFallback from '@/components/ImageWithFallback';
import { weaponTypeKey } from '@/lib/data';
import type { Weapon } from '@/lib/data';

interface WeaponCardProps {
  weapon: Weapon;
  selected: boolean;
  disabled: boolean;
  onToggleCompare: (id: string) => void;
}

export default function WeaponCard({ weapon, selected, disabled, onToggleCompare }: WeaponCardProps) {
  const { t } = useTranslation();
  const typeKey = weaponTypeKey(weapon.type);

  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-xl border bg-white/[0.03] transition-colors ${
        selected ? 'border-tunisian-red/70' : 'border-white/10 hover:border-tunisian-sand/40'
      }`}
    >
      <div className="relative aspect-[4/3] bg-black/30">
        <ImageWithFallback
          src={weapon.image}
          alt={weapon.name}
          wrapperClassName="h-full w-full"
          imgClassName="h-full w-full object-contain p-4 transition-transform duration-200 group-hover:scale-105"
        />
        {weapon.mk !== null && (
          <span className="absolute end-2 top-2 rounded-full border border-white/15 bg-black/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/80">
            Mk {weapon.mk}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="text-base font-semibold leading-tight text-white">{weapon.name}</h3>
          <p className="mt-0.5 text-xs text-white/45">
            {weapon.family ?? '—'}
            {typeKey && t(typeKey) !== typeKey ? ` · ${t(typeKey)}` : ''}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
          <div className="flex justify-between gap-2">
            <dt className="text-white/45">{t('ui.stat.damage')}</dt>
            <dd className="font-semibold text-white/90">{weapon.damage ?? '—'}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-white/45">{t('ui.stat.dps')}</dt>
            <dd className="font-semibold text-tunisian-sand">{weapon.dps ?? '—'}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-white/45">{t('ui.stat.rpm')}</dt>
            <dd className="font-semibold text-white/90">{weapon.rpm ?? '—'}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-white/45">{t('ui.stat.range')}</dt>
            <dd className="font-semibold text-white/90">
              {weapon.rangeM === null ? '—' : `${weapon.rangeM} m`}
            </dd>
          </div>
        </dl>

        <label
          className={`mt-auto flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs transition-colors ${
            selected
              ? 'border-tunisian-red/60 bg-tunisian-red/10 text-white'
              : 'border-white/10 text-white/60 hover:border-white/25 hover:text-white'
          } ${disabled && !selected ? 'cursor-not-allowed opacity-40' : ''}`}
        >
          <span>{selected ? t('ui.compare.remove') : t('ui.compare.add')}</span>
          <input
            type="checkbox"
            className="h-3.5 w-3.5 accent-[#E70013]"
            checked={selected}
            disabled={disabled && !selected}
            onChange={() => onToggleCompare(weapon.id)}
            aria-label={`${selected ? t('ui.compare.remove') : t('ui.compare.add')} — ${weapon.name}`}
          />
        </label>
      </div>
    </article>
  );
}
