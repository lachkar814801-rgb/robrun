import { describe, it, expect } from 'vitest';
import { formatPrice } from '../format';

describe('formatPrice', () => {
  it('formate un prix en USD en anglais', () => {
    expect(formatPrice(100, 'en')).toBe('$100.00');
    expect(formatPrice(46000, 'en')).toBe('$46,000.00');
  });

  it('formate un prix en USD en français', () => {
    const formatted = formatPrice(46000, 'fr');
    expect(formatted).toContain('46');
    expect(formatted).toContain('000,00');
    expect(formatted).toContain('$US');
  });

  it('formate un prix en USD en arabe avec des chiffres occidentaux', () => {
    const formatted = formatPrice(100, 'ar');
    expect(formatted).toContain('100.00');
    expect(formatted).toContain('US$');
    // Aucun chiffre arabo-indien (٠١٢٣٤٥٦٧٨٩)
    expect(formatted).not.toMatch(/[\u0660-\u0669]/);
  });

  it('retourne « non vendable » quand le montant est null', () => {
    expect(formatPrice(null, 'fr')).toBe('Non vendable');
    expect(formatPrice(undefined, 'en')).toBe('Not for sale');
    expect(formatPrice(null, 'ar')).toBe('غير قابل للبيع');
  });
});
