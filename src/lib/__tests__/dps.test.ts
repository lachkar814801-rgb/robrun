import { describe, it, expect } from 'vitest';
import { calculateDPS } from '../dps';

describe('calculateDPS', () => {
  it('calcule le DPS correctement (dégâts × cadence / 60, arrondi)', () => {
    expect(calculateDPS(14, 1000)).toBe(233); // 14 * 1000 / 60 = 233.33 → 233
    expect(calculateDPS(34, 240)).toBe(136);  // 34 * 240 / 60 = 136
    expect(calculateDPS(18, 750)).toBe(225);  // 18 * 750 / 60 = 225
    expect(calculateDPS(9, 120)).toBe(18);    // 9 * 120 / 60 = 18
  });

  it('gère les valeurs nulles ou zéro', () => {
    expect(calculateDPS(0, 1000)).toBe(0);
    expect(calculateDPS(14, 0)).toBe(0);
  });
});
