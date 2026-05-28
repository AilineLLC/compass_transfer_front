import { describe, it, expect } from 'vitest';
import {
  getBasicServiceDataStatus,
  getBasicServiceDataErrors,
  getBasicServiceDataStatusForUpdate,
  getBasicServiceDataErrorsForUpdate,
} from '../ui';
import type { ServiceCreateFormData } from '@entities/services/schemas/serviceCreateSchema';
import type { FieldErrors } from 'react-hook-form';

const validData: ServiceCreateFormData = {
  name: 'Трансфер',
  description: 'Описание',
  price: 500,
  isQuantifiable: false,
};

const emptyErrors: FieldErrors<ServiceCreateFormData> = {};

describe('getBasicServiceDataStatus', () => {
  it('returns complete when all required fields filled with description', () => {
    expect(getBasicServiceDataStatus(validData, emptyErrors, false)).toBe('complete');
  });

  it('returns warning when description is empty', () => {
    const data = { ...validData, description: '' };
    expect(getBasicServiceDataStatus(data, emptyErrors, false)).toBe('warning');
  });

  it('returns error when there are field errors', () => {
    const errors: FieldErrors<ServiceCreateFormData> = {
      name: { type: 'required', message: 'Обязательное поле' },
    };
    expect(getBasicServiceDataStatus(validData, errors, true)).toBe('error');
  });

  it('returns pending when required fields not filled', () => {
    const data = { ...validData, name: '' };
    expect(getBasicServiceDataStatus(data as any, emptyErrors, false)).toBe('pending');
  });
});

describe('getBasicServiceDataErrors', () => {
  it('returns empty array when no errors', () => {
    expect(getBasicServiceDataErrors(validData, emptyErrors, false)).toEqual([]);
  });

  it('returns error messages when errors present', () => {
    const errors: FieldErrors<ServiceCreateFormData> = {
      name: { type: 'required', message: 'Название обязательно' },
      price: { type: 'required', message: 'Цена обязательна' },
    };
    const result = getBasicServiceDataErrors(validData, errors, true);
    expect(result).toContain('Название обязательно');
    expect(result).toContain('Цена обязательна');
  });
});

describe('getBasicServiceDataStatusForUpdate', () => {
  it('returns complete for valid data', () => {
    expect(getBasicServiceDataStatusForUpdate(validData, emptyErrors, false)).toBe('complete');
  });

  it('returns warning when description is empty', () => {
    const data = { ...validData, description: '' };
    expect(getBasicServiceDataStatusForUpdate(data, emptyErrors, false)).toBe('warning');
  });

  it('returns warning when description is only whitespace', () => {
    const data = { ...validData, description: '   ' };
    expect(getBasicServiceDataStatusForUpdate(data, emptyErrors, false)).toBe('warning');
  });

  it('returns pending when required fields are not filled', () => {
    const data = { ...validData, name: '', price: 0 };
    expect(getBasicServiceDataStatusForUpdate(data as any, emptyErrors, false)).toBe('pending');
  });

  it('returns error when field errors present', () => {
    const errors: FieldErrors<ServiceCreateFormData> = {
      price: { type: 'min', message: 'Цена должна быть больше нуля' },
    };
    expect(getBasicServiceDataStatusForUpdate(validData, errors, true)).toBe('error');
  });
});

describe('getBasicServiceDataErrorsForUpdate', () => {
  it('returns empty array when no errors', () => {
    expect(getBasicServiceDataErrorsForUpdate(validData, emptyErrors, false)).toEqual([]);
  });

  it('returns error messages for all error fields', () => {
    const errors: FieldErrors<ServiceCreateFormData> = {
      description: { type: 'maxLength', message: 'Описание слишком длинное' },
    };
    const result = getBasicServiceDataErrorsForUpdate(validData, errors, true);
    expect(result).toContain('Описание слишком длинное');
  });
});
