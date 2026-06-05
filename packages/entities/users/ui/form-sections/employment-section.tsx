'use client';

import { useFormContext } from 'react-hook-form';
import { Input } from '@shared/ui/forms/input';
import { Label } from '@shared/ui/forms/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui/forms/select';
import { EmploymentType } from '@entities/users/enums';
import { employmentTypeOptions } from '@entities/users/utils/employment-type-utils';

// Правильный интерфейс для формы водителя
interface ExtendedFormData {
  employment?: {
    companyName?: string;
    employmentType?: EmploymentType;
    percentage?: number | null;
    fixedAmount?: number | null;
  };
}

export function EmploymentSection() {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<{ employment: ExtendedFormData['employment'] }>();

  const formData = watch();

  // Используем только employment (для водителей)
  const employmentData = formData.employment || {};
  const employmentErrors = errors.employment || {};

  return (
    <div className='space-y-4'>
      <h3 className='text-lg font-medium'>Занятость</h3>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <Label htmlFor='companyName'>Работодатель *</Label>
          <Input
            id='companyName'
            {...register('employment.companyName')}
            placeholder='Название компании'
            className={`focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md focus:shadow-md focus-visible:shadow-md transition-shadow ${
              employmentErrors?.companyName ? 'border-red-500' : ''
            }`}
          />
          {employmentErrors?.companyName && (
            <p className='text-sm text-red-500'>
              {typeof employmentErrors.companyName.message === 'string'
                ? employmentErrors.companyName.message
                : 'Ошибка валидации'}
            </p>
          )}
        </div>

        <div className='space-y-2'>
          <Label htmlFor='employmentType'>Тип занятости *</Label>
          <Select
            value={formData.employment?.employmentType || ''}
            onValueChange={(v) => setValue('employment.employmentType', v as EmploymentType)}
          >
            <SelectTrigger
              className={`focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md focus:shadow-md focus-visible:shadow-md transition-shadow [&>span]:flex-1 [&>span]:text-left ${
                employmentErrors?.employmentType ? 'border-red-500' : ''
              }`}
            >
              <SelectValue placeholder='Выберите тип занятости' />
            </SelectTrigger>
            <SelectContent>
              {employmentTypeOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {employmentErrors?.employmentType && (
            <p className='text-sm text-red-500'>
              {typeof employmentErrors.employmentType.message === 'string'
                ? employmentErrors.employmentType.message
                : 'Ошибка валидации'}
            </p>
          )}
        </div>

        {/* Дополнительные поля в зависимости от типа занятости */}
        {employmentData?.employmentType === EmploymentType.Percentage && (
          <div className='md:col-span-2 space-y-2'>
            <Label htmlFor='percentage'>Процент от выручки *</Label>
            <Input
              id='percentage'
              type='number'
              step='0.01'
              min='0'
              max='100'
              {...register('employment.percentage', { valueAsNumber: true })}
              placeholder='Введите процент (не более 100%)'
              className={`focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md focus:shadow-md focus-visible:shadow-md transition-shadow ${
                employmentErrors?.percentage ? 'border-red-500' : ''
              }`}
            />
            {employmentErrors?.percentage && (
              <p className='text-sm text-red-500'>
                {typeof employmentErrors.percentage.message === 'string'
                  ? employmentErrors.percentage.message
                  : 'Ошибка валидации'}
              </p>
            )}
          </div>
        )}

        {employmentData?.employmentType === EmploymentType.FixedAmount && (
          <div className='md:col-span-2 space-y-2'>
            <Label htmlFor='fixedAmount'>Фиксированная сумма *</Label>
            <Input
              id='fixedAmount'
              type='number'
              step='0.01'
              min='0'
              max='10000'
              {...register('employment.fixedAmount', { valueAsNumber: true })}
              placeholder='Введите сумму (не более 10000)'
              className={`focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md focus:shadow-md focus-visible:shadow-md transition-shadow ${
                employmentErrors?.fixedAmount ? 'border-red-500' : ''
              }`}
            />
            {employmentErrors?.fixedAmount && (
              <p className='text-sm text-red-500'>
                {typeof employmentErrors.fixedAmount.message === 'string'
                  ? employmentErrors.fixedAmount.message
                  : 'Ошибка валидации'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
