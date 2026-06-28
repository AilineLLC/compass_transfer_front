'use client';

import type { GetDriverDTO } from '@entities/users/interface';

interface DriverLicenseInfoProps {
  driver: GetDriverDTO;
}

export function DriverLicenseInfo({ driver }: DriverLicenseInfoProps) {
  return (
    <div className='space-y-4'>
      <h3 className='text-lg font-semibold'>Водительское удостоверение</h3>
      <div className='p-4 rounded-lg border bg-green-50 border-green-200'>
        <div className='space-y-3'>
          <div className='flex justify-between'>
            <span className='text-sm text-muted-foreground'>
              Номер удостоверения:
            </span>
            <span className='font-medium'>{driver.profile.licenseNumber}</span>
          </div>
          <div className='flex justify-between'>
            <span className='text-sm text-muted-foreground'>Категории:</span>
            <span className='font-medium'>
              {(driver.profile.licenseCategories ?? []).length > 0
                ? (driver.profile.licenseCategories ?? []).join(', ')
                : 'Не указаны'
              }
            </span>
          </div>
          {driver.profile.licenseIssueDate && (
          <div className='flex justify-between'>
            <span className='text-sm text-muted-foreground'>Дата выдачи:</span>
            <span className='font-medium'>
              {new Date(driver.profile.licenseIssueDate).toLocaleDateString('ru-RU')}
            </span>
          </div>
          )}
          {driver.profile.licenseExpiryDate && (
          <div className='flex justify-between'>
            <span className='text-sm text-muted-foreground'>Срок действия:</span>
            <span className='font-medium'>
              {new Date(driver.profile.licenseExpiryDate).toLocaleDateString('ru-RU')}
            </span>
          </div>
          )}
          {driver.profile.licenseExpiryDate && (
          <div className='flex justify-between'>
            <span className='text-sm text-muted-foreground'>Статус:</span>
            <span className={`font-medium ${
              new Date(driver.profile.licenseExpiryDate) > new Date()
                ? 'text-green-600'
                : 'text-red-600'
            }`}>
              {new Date(driver.profile.licenseExpiryDate) > new Date()
                ? 'Действительно'
                : 'Просрочено'
              }
            </span>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
