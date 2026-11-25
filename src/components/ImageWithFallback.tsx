import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ImageWithFallbackProps {
  src: string | null | undefined;
  alt: string;
  wrapperClassName?: string;
  imgClassName?: string;
  loading?: 'lazy' | 'eager';
}

/**
 * Affiche une image locale ou un cadre neutre « image à venir ».
 * Aucune image n'est générée : si la source est absente ou cassée, on n'affiche que le cadre.
 */
export default function ImageWithFallback({
  src,
  alt,
  wrapperClassName = '',
  imgClassName = '',
  loading = 'lazy',
}: ImageWithFallbackProps) {
  const { t } = useTranslation();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex items-center justify-center border border-dashed border-white/15 bg-white/[0.03] text-center text-[11px] uppercase tracking-wide text-white/35 ${wrapperClassName}`}
      >
        {t('ui.image.pending')}
      </div>
    );
  }

  return (
    <div className={`overflow-hidden ${wrapperClassName}`}>
      <img
        src={src}
        alt={alt}
        loading={loading}
        decoding="async"
        onError={() => setFailed(true)}
        className={imgClassName}
      />
    </div>
  );
}
