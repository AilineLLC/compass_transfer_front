import { describe, it, expect } from 'vitest';
import { formatPriceWithUsd, formatPrice } from '../format-price-with-usd';

describe('formatPriceWithUsd', () => {
  it('returns soms only when usdRate is null', () => {
    const result = formatPriceWithUsd(1000, null);
    expect(result).toContain('сом');
    expect(result).not.toContain('$');
  });

  it('returns soms only when usdRate is 0', () => {
    const result = formatPriceWithUsd(1000, 0);
    expect(result).toContain('сом');
    expect(result).not.toContain('$');
  });

  it('returns soms only when usdRate is negative', () => {
    const result = formatPriceWithUsd(1000, -1);
    expect(result).toContain('сом');
    expect(result).not.toContain('$');
  });

  it('includes dollar equivalent when rate is valid', () => {
    const result = formatPriceWithUsd(8700, 87);
    expect(result).toContain('сом');
    expect(result).toContain('$');
  });

  it('formats zero price', () => {
    const result = formatPriceWithUsd(0, null);
    expect(result).toContain('сом');
  });
});

describe('formatPrice', () => {
  it('formats price with KGS currency', () => {
    const result = formatPrice(1500);
    expect(result).toContain('1');
    expect(result).toMatch(/KGS|сом|KGS/);
  });

  it('formats zero', () => {
    const result = formatPrice(0);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});
