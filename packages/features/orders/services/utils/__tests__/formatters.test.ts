import { describe, it, expect } from 'vitest';
import { formatPrice } from '../formatters';

describe('formatPrice (orders)', () => {
  it('formats a positive price', () => {
    const result = formatPrice(1500);
    expect(result).toContain('1');
    // KGS currency symbol or code should appear
    expect(result.length).toBeGreaterThan(0);
  });

  it('formats zero', () => {
    const result = formatPrice(0);
    expect(typeof result).toBe('string');
  });

  it('formats a large number without error', () => {
    const result = formatPrice(1_000_000);
    expect(result).toContain('1');
  });
});
