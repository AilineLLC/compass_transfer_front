import { describe, it, expect } from 'vitest';
import { isValidLanguage } from '../validation';

describe('isValidLanguage', () => {
  it('returns true for supported locales', () => {
    expect(isValidLanguage('kg')).toBe(true);
    expect(isValidLanguage('ru')).toBe(true);
    expect(isValidLanguage('en')).toBe(true);
  });

  it('returns false for unsupported locale', () => {
    expect(isValidLanguage('fr')).toBe(false);
    expect(isValidLanguage('de')).toBe(false);
    expect(isValidLanguage('')).toBe(false);
  });

  it('is case-sensitive', () => {
    expect(isValidLanguage('RU')).toBe(false);
    expect(isValidLanguage('EN')).toBe(false);
  });
});
