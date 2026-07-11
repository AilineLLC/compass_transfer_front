import { describe, it, expect } from 'vitest';
import { cn, createDateTimeTransform } from '../utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'skipped', 'included')).toBe('base included');
  });

  it('resolves tailwind conflicts (last wins)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('returns empty string for no args', () => {
    expect(cn()).toBe('');
  });
});

describe('createDateTimeTransform', () => {
  const schema = createDateTimeTransform();

  it('converts valid date string to ISO format', () => {
    const result = schema.safeParse('2024-01-15');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }
  });

  it('returns empty string for empty input', () => {
    const result = schema.safeParse('');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('');
    }
  });

  it('fails for invalid date', () => {
    const result = schema.safeParse('not-a-date');
    expect(result.success).toBe(false);
  });
});
