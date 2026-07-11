import { describe, it, expect } from 'vitest';
import { serviceCreateSchema } from '../serviceCreateSchema';
import { serviceUpdateSchema } from '../serviceUpdateSchema';

const validService = {
  name: 'Трансфер из аэропорта',
  description: 'Удобный трансфер',
  price: 500,
  isQuantifiable: false,
};

describe('serviceCreateSchema', () => {
  it('accepts valid data', () => {
    expect(serviceCreateSchema.safeParse(validService).success).toBe(true);
  });

  it('accepts data without description (optional)', () => {
    const { description: _, ...rest } = validService;
    expect(serviceCreateSchema.safeParse(rest).success).toBe(true);
  });

  it('rejects empty name', () => {
    const r = serviceCreateSchema.safeParse({ ...validService, name: '' });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.flatten().fieldErrors.name).toBeDefined();
  });

  it('rejects name longer than 127 chars', () => {
    const r = serviceCreateSchema.safeParse({ ...validService, name: 'a'.repeat(128) });
    expect(r.success).toBe(false);
  });

  it('rejects description longer than 255 chars', () => {
    const r = serviceCreateSchema.safeParse({ ...validService, description: 'x'.repeat(256) });
    expect(r.success).toBe(false);
  });

  it('rejects missing price', () => {
    const { price: _, ...rest } = validService;
    const r = serviceCreateSchema.safeParse(rest);
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.flatten().fieldErrors.price).toBeDefined();
  });

  it('rejects negative price', () => {
    const r = serviceCreateSchema.safeParse({ ...validService, price: -100 });
    expect(r.success).toBe(false);
  });

  it('rejects price of zero', () => {
    const r = serviceCreateSchema.safeParse({ ...validService, price: 0 });
    expect(r.success).toBe(false);
  });

  it('rejects price exceeding 999999', () => {
    const r = serviceCreateSchema.safeParse({ ...validService, price: 1_000_000 });
    expect(r.success).toBe(false);
  });

  it('rejects missing isQuantifiable', () => {
    const { isQuantifiable: _, ...rest } = validService;
    const r = serviceCreateSchema.safeParse(rest);
    expect(r.success).toBe(false);
  });
});

describe('serviceUpdateSchema', () => {
  it('accepts valid data', () => {
    expect(serviceUpdateSchema.safeParse(validService).success).toBe(true);
  });

  it('rejects empty name', () => {
    const r = serviceUpdateSchema.safeParse({ ...validService, name: '' });
    expect(r.success).toBe(false);
  });

  it('rejects non-positive price', () => {
    const r = serviceUpdateSchema.safeParse({ ...validService, price: 0 });
    expect(r.success).toBe(false);
  });
});
