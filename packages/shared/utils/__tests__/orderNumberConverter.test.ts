import { describe, it, expect } from 'vitest';
import { orderNumberToString, orderNumberToInteger, isValidOrderNumber } from '../orderNumberConverter';

describe('orderNumberToString', () => {
  it('converts integer to base36 uppercase', () => {
    expect(orderNumberToString(1679627)).toBe('1000B');
  });

  it('converts 1 to "1"', () => {
    expect(orderNumberToString(1)).toBe('1');
  });

  it('converts 35 to "Z"', () => {
    expect(orderNumberToString(35)).toBe('Z');
  });
});

describe('orderNumberToInteger', () => {
  it('converts base36 string back to integer', () => {
    expect(orderNumberToInteger('1000B')).toBe(1679627);
  });

  it('is case-insensitive', () => {
    expect(orderNumberToInteger('1000b')).toBe(1679627);
  });

  it('round-trips with orderNumberToString', () => {
    const original = 999999;
    expect(orderNumberToInteger(orderNumberToString(original))).toBe(original);
  });
});

describe('isValidOrderNumber', () => {
  it('returns true for valid base36 string', () => {
    expect(isValidOrderNumber('1000B')).toBe(true);
  });

  it('returns true for numeric string', () => {
    expect(isValidOrderNumber('123')).toBe(true);
  });

  it('returns false for empty string', () => {
    expect(isValidOrderNumber('')).toBe(false);
  });

  it('returns false for string starting with invalid char', () => {
    expect(isValidOrderNumber('#$%!')).toBe(false);
  });

  it('returns false for "0"', () => {
    expect(isValidOrderNumber('0')).toBe(false);
  });
});
