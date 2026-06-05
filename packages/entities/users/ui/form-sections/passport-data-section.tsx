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
import {
  type PassportDataFields,
} from '@entities/users/model/validation/ui/passport-data';
import { identityDocumentOptions } from '@entities/users/utils/identity-document-utils';

export function PassportDataSection() {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<{ profile: PassportDataFields['profile'] }>();
  const formData = watch();

  return (
    <div className='space-y-4'>
      <h3 className='text-lg font-medium'>Паспортные данные</h3>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <Label htmlFor='passportNumber'>Номер паспорта *</Label>
          <Input
            id='passportNumber'
            {...register('profile.passport.number')}
            placeholder='Введите номер паспорта'
            className={`focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md focus:shadow-md focus-visible:shadow-md transition-shadow ${
              errors.profile?.passport?.number ? 'border-red-500' : ''
            }`}
          />
          {errors.profile?.passport?.number && (
            <p className='text-sm text-red-500'>
              {typeof errors.profile.passport.number.message === 'string'
                ? errors.profile.passport.number.message
                : 'Ошибка валидации'}
            </p>
          )}
        </div>

        <div className='space-y-2'>
          <Label htmlFor='identityType'>Тип документа *</Label>
          <Select
            value={formData.profile.passport.identityType || ''}
            onValueChange={(v) => setValue('profile.passport.identityType', v)}
          >
            <SelectTrigger
              className={`focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md focus:shadow-md focus-visible:shadow-md transition-shadow [&>span]:flex-1 [&>span]:text-left ${
                errors.profile?.passport?.identityType ? 'border-red-500' : ''
              }`}
            >
              <SelectValue placeholder='Выберите тип документа' />
            </SelectTrigger>
            <SelectContent>
              {identityDocumentOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.profile?.passport?.identityType && (
            <p className='text-sm text-red-500'>
              {typeof errors.profile.passport.identityType.message === 'string'
                ? errors.profile.passport.identityType.message
                : 'Ошибка валидации'}
            </p>
          )}
        </div>

        <div className='space-y-2'>
          <Label htmlFor='passportSeries'>Серия паспорта</Label>
          <Input
            id='passportSeries'
            {...register('profile.passport.series')}
            placeholder='AN'
            maxLength={2}
            className='focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md focus:shadow-md focus-visible:shadow-md transition-shadow'
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='passportIssuedBy'>Кем выдан</Label>
          <Input
            id='passportIssuedBy'
            {...register('profile.passport.issuedBy')}
            placeholder='Орган, выдавший документ'
            className='focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md focus:shadow-md focus-visible:shadow-md transition-shadow'
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='passportIssueDate'>Дата выдачи</Label>
          <Input
            id='passportIssueDate'
            type='date'
            {...register('profile.passport.issueDate')}
            className='focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md focus:shadow-md focus-visible:shadow-md transition-shadow'
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='passportExpiryDate'>Срок действия</Label>
          <Input
            id='passportExpiryDate'
            type='date'
            {...register('profile.passport.expiryDate')}
            className='focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md focus:shadow-md focus-visible:shadow-md transition-shadow'
          />
        </div>
      </div>
    </div>
  );
}
