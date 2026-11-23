/**
 * Détermine si une langue doit s'afficher en RTL (droite-à-gauche).
 */
export function isRTL(lang: string): boolean {
  return lang === 'ar';
}

/**
 * Met à jour l'attribut <html lang> et dir selon la langue active.
 */
export function setHtmlLangDir(lang: string): void {
  const html = document.documentElement;
  html.lang = lang;
  html.dir = isRTL(lang) ? 'rtl' : 'ltr';
}
