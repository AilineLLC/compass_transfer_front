import type { FieldErrors } from 'react-hook-form';
import type { AreaCreateFormData } from '../../schemas/areaCreateSchema';

export function getBasicAreaDataStatus(
  formData: AreaCreateFormData,
  errors: FieldErrors<AreaCreateFormData>,
  isSubmitted: boolean,
): 'complete' | 'warning' | 'error' | 'pending' {
  if (errors.name || errors.city) return 'error';
  const nameFilled = formData.name && formData.name.trim().length > 0;
  const cityFilled = formData.city && formData.city.trim().length > 0;
  if (!nameFilled || !cityFilled) return 'pending';
  return 'complete';
}

export function getMapAreaDataStatus(
  formData: AreaCreateFormData,
  errors: FieldErrors<AreaCreateFormData>,
  isSubmitted: boolean,
): 'complete' | 'warning' | 'error' | 'pending' {
  if (errors.poly) return 'error';
  const count = Math.floor((formData.poly?.length ?? 0) / 2);
  if (count === 0) return 'pending';
  if (count < 3) return 'warning';
  return 'complete';
}

export function getBasicAreaDataErrors(
  formData: AreaCreateFormData,
  errors: FieldErrors<AreaCreateFormData>,
  isSubmitted: boolean,
): string[] {
  const result: string[] = [];
  if (errors.name?.message) result.push(errors.name.message);
  if (errors.city?.message) result.push(errors.city.message);
  return result;
}

export function getMapAreaDataErrors(
  formData: AreaCreateFormData,
  errors: FieldErrors<AreaCreateFormData>,
  isSubmitted: boolean,
): string[] {
  const result: string[] = [];
  if (errors.poly?.message) result.push(errors.poly.message);
  const count = Math.floor((formData.poly?.length ?? 0) / 2);
  if (count > 0 && count < 3) result.push(`Добавлено ${count} из минимум 3 точек`);
  return result;
}
