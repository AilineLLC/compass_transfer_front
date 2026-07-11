'use client';

import { useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import { Badge } from '@shared/ui/data-display/badge';
import { DatePicker } from '@shared/ui/forms/date-picker';
import { Input } from '@shared/ui/forms/input';
import { Label } from '@shared/ui/forms/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui/forms/select';
import { type PersonalInfoFields } from '@entities/users/model/validation/ui/personal-info';
import { languageOptions, citizenshipOptions } from '@entities/users/utils';

export function PersonalInfoSection() {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<{ profile: PersonalInfoFields['profile'] }>();
  const formData = watch();

  const toggleLanguage = useCallback(
    (language: string) => {
      const currentLanguages = formData.profile.languages || [];
      const newLanguages = currentLanguages.includes(language)
        ? currentLanguages.filter((l: string) => l !== language)
        : [...currentLanguages, language];

      setValue('profile.languages', newLanguages);
    },
    [formData.profile.languages, setValue],
  );

  // Функция для работы с датой рождения (исправляем проблему с часовыми поясами)
  const handleDateOfBirth = (date: Date | undefined) => {
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      setValue('profile.dateOfBirth', `${year}-${month}-${day}`);
    } else {
      setValue('profile.dateOfBirth', '');
    }
  };

  // Преобразуем строку даты в объект Date для DatePicker
  const dateOfBirth = formData.profile?.dateOfBirth ? new Date(formData.profile.dateOfBirth) : undefined;

  return (
    <div className='space-y-4'>
      <h3 className='text-lg font-medium'>Личные данные</h3>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <Label htmlFor='birthPlace'>Место рождения</Label>
          <Input
            id='birthPlace'
            {...register('profile.birthPlace')}
            placeholder='Введите место рождения'
            className='focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md focus:shadow-md focus-visible:shadow-md transition-shadow'
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='dateOfBirth'>Дата рождения *</Label>
          <DatePicker
            id='dateOfBirth'
            value={dateOfBirth}
            onChange={handleDateOfBirth}
            placeholder='Выберите дату рождения'
            className={errors.profile?.dateOfBirth?.message ? 'border-red-500' : ''}
            maxDate={new Date()}
          />
          {errors.profile?.dateOfBirth?.message && (
            <p className='text-sm text-red-500'>
              {typeof errors.profile.dateOfBirth.message === 'string'
                ? errors.profile.dateOfBirth.message
                : 'Ошибка валидации'}
            </p>
          )}
        </div>

        <div className='space-y-2'>
          <Label htmlFor='citizenship'>Гражданство *</Label>
          <Select
            value={formData.profile.citizenship || ''}
            onValueChange={(v) => setValue('profile.citizenship', v)}
          >
            <SelectTrigger
              className={`focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md focus:shadow-md focus-visible:shadow-md transition-shadow ${
                errors.profile?.citizenship?.message ? 'border-red-500' : ''
              }`}
            >
              <SelectValue placeholder='Выберите гражданство' />
            </SelectTrigger>
            <SelectContent>
              {citizenshipOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.profile?.citizenship?.message && (
            <p className='text-sm text-red-500'>
              {typeof errors.profile.citizenship.message === 'string'
                ? errors.profile.citizenship.message
                : 'Ошибка валидации'}
            </p>
          )}
        </div>

        {formData.profile.citizenship === 'Other' && (
          <div className='md:col-span-2 space-y-2'>
            <Label htmlFor='citizenshipCountry'>Укажите страну гражданства</Label>
            <Input
              id='citizenshipCountry'
              {...register('profile.citizenshipCountry')}
              placeholder='Введите страну гражданства'
              className={`focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md focus:shadow-md focus-visible:shadow-md transition-shadow ${
                errors.profile?.citizenshipCountry?.message ? 'border-red-500' : ''
              }`}
            />
            {errors.profile?.citizenshipCountry?.message && (
              <p className='text-sm text-red-500'>
                {typeof errors.profile.citizenshipCountry.message === 'string'
                  ? errors.profile.citizenshipCountry.message
                  : 'Ошибка валидации'}
              </p>
            )}
          </div>
        )}

        <div className='md:col-span-2 space-y-2'>
          <Label>Знание языков *</Label>
          <div className='flex flex-wrap gap-2'>
            {languageOptions.map(language => (
              <Badge
                key={language.value}
                variant={
                  formData.profile.languages?.includes(language.value) ? 'default' : 'outline'
                }
                className='cursor-pointer hover:bg-primary/80 hover:text-white'
                onClick={() => toggleLanguage(language.value)}
              >
                {language.label}
              </Badge>
            ))}
          </div>
          {errors.profile?.languages && (
            <p className='text-sm text-red-500'>
              {typeof errors.profile.languages.message === 'string'
                ? errors.profile.languages.message
                : 'Ошибка валидации'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
