export type Lang = 'en' | 'fr' | 'ar';

/**
 * Locales de formatage : le prix est toujours en USD (monnaie du jeu).
 * L'arabe utilise explicitement les chiffres occidentaux (0-9).
 */
const PRICE_LOCALES: Record<Lang, string> = {
  en: 'en-US',
  fr: 'fr-FR',
  ar: 'ar-u-nu-latn',
};

const NOT_FOR_SALE_LABELS: Record<Lang, string> = {
  en: 'Not for sale',
  fr: 'Non vendable',
  ar: 'غير قابل للبيع',
};

/**
 * Formate un prix en USD, avec le format de la langue active.
 * Aucune conversion de devise n'est effectuée.
 * Si le montant est null/undefined, retourne « non vendable » dans la langue active.
 */
export function formatPrice(amount: number | null | undefined, lang: Lang = 'fr'): string {
  if (amount === null || amount === undefined) {
    return NOT_FOR_SALE_LABELS[lang];
  }

  return new Intl.NumberFormat(PRICE_LOCALES[lang], {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}
