import { describe, it, expect } from 'vitest';
import { loginSchema, partnerRegisterSchema } from '../../schemas';
import { changePasswordSchema } from '../change-password';

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'secret1' }).success).toBe(true);
  });

  it('rejects empty email', () => {
    const r = loginSchema.safeParse({ email: '', password: 'secret1' });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.flatten().fieldErrors.email).toBeDefined();
  });

  it('rejects invalid email format', () => {
    const r = loginSchema.safeParse({ email: 'notanemail', password: 'secret1' });
    expect(r.success).toBe(false);
  });

  it('rejects short password', () => {
    const r = loginSchema.safeParse({ email: 'a@b.com', password: '12345' });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.flatten().fieldErrors.password).toBeDefined();
  });
});

describe('partnerRegisterSchema', () => {
  const valid = {
    email: 'partner@example.com',
    password: 'secure123',
    fullName: 'Иван Иванов',
    companyName: 'ООО Транспорт',
    legalAddress: 'г. Бишкек, ул. Примерная, д. 1',
  };

  it('accepts valid data', () => {
    expect(partnerRegisterSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects invalid email', () => {
    const r = partnerRegisterSchema.safeParse({ ...valid, email: 'bad' });
    expect(r.success).toBe(false);
  });

  it('rejects short password (< 6 chars)', () => {
    const r = partnerRegisterSchema.safeParse({ ...valid, password: '123' });
    expect(r.success).toBe(false);
  });

  it('rejects empty fullName', () => {
    const r = partnerRegisterSchema.safeParse({ ...valid, fullName: '' });
    expect(r.success).toBe(false);
  });

  it('rejects empty companyName', () => {
    const r = partnerRegisterSchema.safeParse({ ...valid, companyName: '' });
    expect(r.success).toBe(false);
  });

  it('rejects empty legalAddress', () => {
    const r = partnerRegisterSchema.safeParse({ ...valid, legalAddress: '' });
    expect(r.success).toBe(false);
  });
});

describe('changePasswordSchema', () => {
  const valid = {
    oldPassword: 'oldPass1',
    newPassword: 'newPass123',
    confirmPassword: 'newPass123',
  };

  it('accepts matching passwords', () => {
    expect(changePasswordSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects empty oldPassword', () => {
    const r = changePasswordSchema.safeParse({ ...valid, oldPassword: '' });
    expect(r.success).toBe(false);
  });

  it('rejects newPassword shorter than 8 chars', () => {
    const r = changePasswordSchema.safeParse({ ...valid, newPassword: 'short', confirmPassword: 'short' });
    expect(r.success).toBe(false);
    if (!r.success) {
      const msgs = r.error.flatten().fieldErrors.newPassword;
      expect(msgs).toBeDefined();
    }
  });

  it('rejects mismatched confirmPassword', () => {
    const r = changePasswordSchema.safeParse({ ...valid, confirmPassword: 'different' });
    expect(r.success).toBe(false);
    if (!r.success) {
      const msgs = r.error.flatten().fieldErrors.confirmPassword;
      expect(msgs).toBeDefined();
    }
  });

  it('rejects empty confirmPassword', () => {
    const r = changePasswordSchema.safeParse({ ...valid, confirmPassword: '' });
    expect(r.success).toBe(false);
  });
});
