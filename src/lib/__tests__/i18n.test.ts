import { describe, it, expect } from 'vitest';
import en from '@/i18n/en.json';
import fr from '@/i18n/fr.json';
import ar from '@/i18n/ar.json';

type LangKeys = typeof en;

describe('i18n parity', () => {
  it('les 3 fichiers de langue ont exactement les mêmes clés', () => {
    const enKeys = Object.keys(en).sort();
    const frKeys = Object.keys(fr).sort();
    const arKeys = Object.keys(ar).sort();

    expect(frKeys).toEqual(enKeys);
    expect(arKeys).toEqual(enKeys);
  });

  it('aucune valeur de traduction n\'est vide', () => {
    const check = (obj: LangKeys) => {
      Object.values(obj).forEach((value) => {
        expect(value.trim().length).toBeGreaterThan(0);
      });
    };
    check(en);
    check(fr);
    check(ar);
  });

  it('les clés de navigation existent dans les 3 langues', () => {
    const navKeys = ['nav.home', 'nav.weapons', 'nav.items', 'nav.map', 'nav.about'] as const;
    navKeys.forEach((key) => {
      expect(en[key]).toBeDefined();
      expect(fr[key]).toBeDefined();
      expect(ar[key]).toBeDefined();
    });
  });
});
