'use client';

import { useCallback, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { Badge } from '@shared/ui/data-display/badge';
import { DatePicker } from '@shared/ui/forms/date-picker';
import { Input } from '@shared/ui/forms/input';
import { Label } from '@shared/ui/forms/label';
import { type DriverLicenseFields } from '@entities/users/model/validation/ui/driver-license';
import { licenseCategories } from '@entities/users/utils/license-categories-utils';

export function DriverLicenseSection() {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<{ profile: DriverLicenseFields['profile'] }>();
  const profile = watch('profile');
  const profileErrors = errors.profile ?? {};
  const toggleCategory = useCallback(
    (category: string) => {
      const currentCategories = profile.licenseCategories || [];
      const newCategories = currentCategories.includes(category)
        ? currentCategories.filter((c: string) => c !== category)
        : [...currentCategories, category];

      setValue('profile.licenseCategories', newCategories);
    },
    [profile.licenseCategories, setValue],
  );

  // Функция для расчета стажа вождения
  const calculateDrivingExperience = (issueDate: Date): number => {
    const today = new Date();
    const diffTime = today.getTime() - issueDate.getTime();
    const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25); // Учитываем високосные годы

    return Math.round(diffYears); // Округляем до целых лет
  };

  // Функции для работы с датами (исправляем проблему с часовыми поясами)
  const handleIssueDate = (date: Date | undefined) => {
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      setValue('profile.licenseIssueDate', `${year}-${month}-${day}`);

      // Автоматически рассчитываем и устанавливаем стаж вождения
      const experience = calculateDrivingExperience(date);

      setValue('profile.drivingExperience', experience);
    } else {
      setValue('profile.licenseIssueDate', '');
      setValue('profile.drivingExperience', null);
    }
  };

  const handleExpiryDate = (date: Date | undefined) => {
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      setValue('profile.licenseExpiryDate', `${year}-${month}-${day}`);
    } else {
      setValue('profile.licenseExpiryDate', '');
    }
  };

  // Преобразуем строки дат в объекты Date для DatePicker
  const issueDate = profile?.licenseIssueDate ? new Date(profile.licenseIssueDate) : undefined;
  const expiryDate = profile?.licenseExpiryDate ? new Date(profile.licenseExpiryDate) : undefined;

  // Автоматически рассчитываем стаж при загрузке, если дата уже заполнена
  useEffect(() => {
    if (profile?.licenseIssueDate && !profile?.drivingExperience) {
      const date = new Date(profile.licenseIssueDate);
      const experience = calculateDrivingExperience(date);

      setValue('profile.drivingExperience', experience);
    }
  }, [profile?.licenseIssueDate, profile?.drivingExperience, setValue]);

  return (
    <div className='space-y-4'>
      <h3 className='text-lg font-medium'>Водительские права</h3>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <Label htmlFor='licenseNumber'>Номер водительского удостоверения *</Label>
          <Input
            id='licenseNumber'
            {...register('profile.licenseNumber')}
            placeholder='Введите номер ВУ'
            className={`focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md focus:shadow-md focus-visible:shadow-md transition-shadow ${
              profileErrors.licenseNumber ? 'border-red-500' : ''
            }`}
          />
          {profileErrors.licenseNumber && (
            <p className='text-sm text-red-500'>
              {typeof profileErrors.licenseNumber.message === 'string'
                ? profileErrors.licenseNumber.message
                : 'Ошибка валидации'}
            </p>
          )}
        </div>

        <div className='space-y-2'>
          <Label htmlFor='drivingExperience'>Стаж вождения (лет) *</Label>
          <Input
            id='drivingExperience'
            type='number'
            {...register('profile.drivingExperience', { valueAsNumber: true })}
            placeholder='Автоматически рассчитывается'
            readOnly
            className={`focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md focus:shadow-md focus-visible:shadow-md transition-shadow bg-gray-50 cursor-not-allowed ${
              profileErrors.drivingExperience ? 'border-red-500' : ''
            }`}
          />
          <p className='text-xs text-gray-500'>
            Автоматически рассчитывается на основе даты выдачи ВУ
          </p>
          {profileErrors.drivingExperience && (
            <p className='text-sm text-red-500'>
              {typeof profileErrors.drivingExperience.message === 'string'
                ? profileErrors.drivingExperience.message
                : 'Ошибка валидации'}
            </p>
          )}
        </div>

        <div className='space-y-2'>
          <Label htmlFor='licenseIssueDate'>Дата выдачи ВУ *</Label>
          <DatePicker
            id='licenseIssueDate'
            value={issueDate}
            onChange={handleIssueDate}
            placeholder='Выберите дату выдачи'
            className={profileErrors.licenseIssueDate ? 'border-red-500' : ''}
            maxDate={new Date()}
          />
          {profileErrors.licenseIssueDate && (
            <p className='text-sm text-red-500'>
              {typeof profileErrors.licenseIssueDate.message === 'string'
                ? profileErrors.licenseIssueDate.message
                : 'Ошибка валидации'}
            </p>
          )}
        </div>

        <div className='space-y-2'>
          <Label htmlFor='licenseExpiryDate'>Дата окончания действия ВУ *</Label>
          <DatePicker
            id='licenseExpiryDate'
            value={expiryDate}
            onChange={handleExpiryDate}
            placeholder='Выберите дату окончания'
            className={profileErrors.licenseExpiryDate ? 'border-red-500' : ''}
            minDate={new Date()}
          />
          {profileErrors.licenseExpiryDate && (
            <p className='text-sm text-red-500'>
              {typeof profileErrors.licenseExpiryDate.message === 'string'
                ? profileErrors.licenseExpiryDate.message
                : 'Ошибка валидации'}
            </p>
          )}
        </div>

        <div className='md:col-span-2 space-y-2'>
          <Label>Категории водительского удостоверения *</Label>
          <div className='flex flex-wrap gap-2'>
            {licenseCategories.map(category => (
              <Badge
                key={category.value}
                variant={
                  profile.licenseCategories?.includes(category.value) ? 'default' : 'outline'
                }
                className='cursor-pointer hover:bg-primary/80 hover:text-white'
                onClick={() => toggleCategory(category.value)}
              >
                {category.label}
              </Badge>
            ))}
          </div>
          {profileErrors.licenseCategories && (
            <p className='text-sm text-red-500'>
              {typeof profileErrors.licenseCategories.message === 'string'
                ? profileErrors.licenseCategories.message
                : 'Ошибка валидации'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
