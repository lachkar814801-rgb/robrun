import { describe, it, expect } from 'vitest';
import { formatPrice } from '../format';

describe('formatPrice', () => {
  it('formate un prix en USD', () => {
    expect(formatPrice(100, 'USD', 'en')).toBe('$100.00');
    expect(formatPrice(46000, 'USD', 'en')).toBe('$46,000.00');
  });

  it('formate un prix en TND (USD × taux)', () => {
    // 100 USD × 3.2 = 320 TND
    const tnd = formatPrice(100, 'TND', 'ar');
    expect(tnd).toContain('320');
    expect(tnd).toContain('د.ت');
  });

  it('retourne "Non vendable" quand le montant est null', () => {
    expect(formatPrice(null, 'USD', 'fr')).toBe('Non vendable');
    expect(formatPrice(undefined, 'USD', 'en')).toBe('Not for sale');
    expect(formatPrice(null, 'USD', 'ar')).toBe('غير قابل للبيع');
  });
});
