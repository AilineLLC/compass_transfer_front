'use client';

import type { GetDriverDTO } from '@entities/users/interface';

interface DriverPassportInfoProps {
  driver: GetDriverDTO;
}

export function DriverPassportInfo({ driver }: DriverPassportInfoProps) {
  const passport = driver.profile.passport;

  if (!passport) {
    return (
      <div className='space-y-4'>
        <h3 className='text-lg font-semibold'>Паспортные данные</h3>
        <p className='text-sm text-muted-foreground'>Паспортные данные не заполнены</p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <h3 className='text-lg font-semibold'>Паспортные данные</h3>
      <div className='p-4 rounded-lg border bg-blue-50 border-blue-200'>
        <div className='space-y-3'>
          <div className='flex justify-between'>
            <span className='text-sm text-muted-foreground'>Серия и номер:</span>
            <span className='font-medium'>
              {passport.series ? `${passport.series} ` : ''}
              {passport.number}
            </span>
          </div>
          <div className='flex justify-between'>
            <span className='text-sm text-muted-foreground'>Дата выдачи:</span>
            <span className='font-medium'>
              {passport.issueDate
                ? new Date(passport.issueDate).toLocaleDateString('ru-RU')
                : 'Не указана'
              }
            </span>
          </div>
          <div className='flex justify-between'>
            <span className='text-sm text-muted-foreground'>Кем выдан:</span>
            <span className='font-medium'>{passport.issuedBy || 'Не указано'}</span>
          </div>
          <div className='flex justify-between'>
            <span className='text-sm text-muted-foreground'>Срок действия:</span>
            <span className='font-medium'>
              {passport.expiryDate
                ? new Date(passport.expiryDate).toLocaleDateString('ru-RU')
                : 'Не указан'
              }
            </span>
          </div>
          <div className='flex justify-between'>
            <span className='text-sm text-muted-foreground'>Тип документа:</span>
            <span className='font-medium'>{passport.identityType || 'Не указан'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
