import { USD_TO_TND } from '@/config/currency';

/**
 * Formate un prix en USD ou TND selon la devise demandée.
 * Si le montant est null/undefined, retourne "Non vendable" (ou l'équivalent dans la langue active).
 */
export function formatPrice(
  amount: number | null | undefined,
  currency: 'USD' | 'TND' = 'USD',
  lang: 'en' | 'fr' | 'ar' = 'fr'
): string {
  if (amount === null || amount === undefined) {
    const labels = { en: 'Not for sale', fr: 'Non vendable', ar: 'غير قابل للبيع' };
    return labels[lang];
  }

  const value = currency === 'TND' ? amount * USD_TO_TND : amount;
  const locale = currency === 'TND' ? 'ar-TN' : 'en-US';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency === 'TND' ? 'TND' : 'USD',
  }).format(value);
}
