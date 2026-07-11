'use client';

import { useFormContext } from 'react-hook-form';
import { Input } from '@shared/ui/forms/input';
import { Label } from '@shared/ui/forms/label';
import { Switch } from '@shared/ui/forms/switch';
import { type EmployeeProfileFields } from '@entities/users/model/validation/ui/employee-profile';

interface EmployeeProfileSectionProps {
  showOptionalWarning?: boolean;
}

export function EmployeeProfileSection({ showOptionalWarning = false }: EmployeeProfileSectionProps) {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<{ profile: EmployeeProfileFields['profile']; isMainSupportOperator: boolean }>(); // Удаляю все локальные определения getEmployeeProfileStatus, getEmployeeProfileErrors, EmployeeProfileFields
  // profile можно использовать для вычислений, если нужно
  const profileErrors = errors.profile ?? {};
  const profile = watch('profile');
  const isMainSupportOperator = watch('isMainSupportOperator');

  return (
    <div className='space-y-4'>
      <h3 className='text-lg font-medium'>Профиль сотрудника</h3>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <Label htmlFor='employeeId'>Табельный номер *</Label>
          <Input
            id='employeeId'
            {...register('profile.employeeId')}
            placeholder='Введите табельный номер'
            className={`focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md focus:shadow-md focus-visible:shadow-md transition-shadow ${
              profileErrors.employeeId ? 'border-red-500' : ''
            }`}
          />
          {profileErrors.employeeId && (
            <p className='text-sm text-red-500'>
              {typeof profileErrors.employeeId.message === 'string'
                ? profileErrors.employeeId.message
                : 'Ошибка валидации'}
            </p>
          )}
        </div>

        <div className='space-y-2'>
          <Label htmlFor='department'>Отдел *</Label>
          <Input
            id='department'
            {...register('profile.department')}
            placeholder='Введите отдел'
            className={`focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md focus:shadow-md focus-visible:shadow-md transition-shadow ${
              profileErrors.department ? 'border-red-500' : ''
            }`}
          />
          {profileErrors.department && (
            <p className='text-sm text-red-500'>
              {typeof profileErrors.department.message === 'string'
                ? profileErrors.department.message
                : 'Ошибка валидации'}
            </p>
          )}
        </div>

        <div className='space-y-2'>
          <Label htmlFor='position'>Должность</Label>
          <Input
            id='position'
            {...register('profile.position')}
            placeholder='Введите должность'
            className={`focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md focus:shadow-md focus-visible:shadow-md transition-shadow ${
              profileErrors.position
                ? 'border-red-500'
                : !profile?.position && showOptionalWarning
                  ? 'border-yellow-400'
                  : ''
            }`}
          />
          {profileErrors.position && (
            <p className='text-sm text-red-500'>
              {typeof profileErrors.position.message === 'string'
                ? profileErrors.position.message
                : 'Ошибка валидации'}
            </p>
          )}
        </div>

        <div className='space-y-2'>
          <Label htmlFor='hireDate'>Дата найма</Label>
          <Input
            id='hireDate'
            type='date'
            max={new Date().toISOString().split('T')[0]}
            {...register('profile.hireDate')}
            className={`focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md focus:shadow-md focus-visible:shadow-md transition-shadow ${
              profileErrors.hireDate
                ? 'border-red-500'
                : !profile?.hireDate && showOptionalWarning
                  ? 'border-yellow-400'
                  : ''
            }`}
          />
          {profileErrors.hireDate && (
            <p className='text-sm text-red-500'>
              {typeof profileErrors.hireDate.message === 'string'
                ? profileErrors.hireDate.message
                : 'Ошибка валидации'}
            </p>
          )}
        </div>
      </div>

      <div className='flex items-start gap-3 rounded-lg border p-4'>
        <Switch
          id='isMainSupportOperator'
          checked={!!isMainSupportOperator}
          onCheckedChange={(checked) =>
            setValue('isMainSupportOperator', checked, { shouldDirty: true })
          }
          className='mt-0.5'
        />
        <div className='space-y-1'>
          <Label htmlFor='isMainSupportOperator' className='cursor-pointer'>
            Главный оператор поддержки
          </Label>
          <p className='text-xs text-muted-foreground'>
            Даёт доступ к разделу «Чат с водителями». Этот статус должен быть только у одного оператора —
            при включении у другого оператора его стоит выключить вручную.
          </p>
        </div>
      </div>
    </div>
  );
}
