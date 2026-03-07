'use client';

import { Building, Users } from 'lucide-react';
import { Badge } from '@shared/ui/data-display/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/layout/card';
import type { GetPartnerDTO } from '@entities/users/interface';
import type { SectionWithMapProps } from '@entities/users/ui/profile-sections/types';

// Type guard для проверки партнера
function isPartnerData(profile: SectionWithMapProps['profile']): profile is GetPartnerDTO {
  return 'role' in profile && profile.role === 'Partner';
}

export function PartnerSection({ profile, openMapSheet: _openMapSheet }: SectionWithMapProps) {
  if (!isPartnerData(profile)) return null;

  const partnerProfile = profile.profile;

  return (
    <div className='flex flex-col gap-6'>
      {/* Основная информация компании */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Building className='h-5 w-5' />
            Информация компании
          </CardTitle>
        </CardHeader>
        <CardContent className='flex flex-col gap-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='border-l-4 border-blue-200 pl-4 flex flex-col gap-2'>
              <label className='text-sm font-medium text-muted-foreground'>Название компании</label>
              <p className='text-sm font-medium'>{partnerProfile.companyName}</p>
            </div>

            <div className='border-l-4 border-green-200 pl-4 flex flex-col gap-2'>
              <label className='text-sm font-medium text-muted-foreground'>Тип компании</label>
              <Badge variant='outline' className='w-fit'>
                {partnerProfile.companyType || 'Не указан'}
              </Badge>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='border-l-4 border-purple-200 pl-4 flex flex-col gap-2'>
              <label className='text-sm font-medium text-muted-foreground'>Регистрационный номер</label>
              <p className='text-sm font-mono'>{partnerProfile.registrationNumber}</p>
            </div>

            <div className='border-l-4 border-orange-200 pl-4 flex flex-col gap-2'>
              <label className='text-sm font-medium text-muted-foreground'>Налоговый идентификатор</label>
              <p className='text-sm font-mono'>{partnerProfile.taxIdentifier || 'Не указан'}</p>
            </div>
          </div>

          <div className='border-l-4 border-pink-200 pl-4 flex flex-col gap-2'>
            <label className='text-sm font-medium text-muted-foreground'>Юридический адрес</label>
            <p className='text-sm'>{partnerProfile.legalAddress}</p>
          </div>
        </CardContent>
      </Card>

      {/* Контактная информация */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Users className='h-5 w-5' />
            Контактная информация
          </CardTitle>
        </CardHeader>
        <CardContent className='flex flex-col gap-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='border-l-4 border-blue-200 pl-4 flex flex-col gap-2'>
              <label className='text-sm font-medium text-muted-foreground'>Контактный телефон</label>
              <p className='text-sm'>{partnerProfile.contactPhone || 'Не указан'}</p>
            </div>

            <div className='border-l-4 border-green-200 pl-4 flex flex-col gap-2'>
              <label className='text-sm font-medium text-muted-foreground'>Контактный email</label>
              <p className='text-sm'>{partnerProfile.contactEmail || 'Не указан'}</p>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='border-l-4 border-purple-200 pl-4 flex flex-col gap-2'>
              <label className='text-sm font-medium text-muted-foreground'>Телефон</label>
              <p className='text-sm font-mono'>{partnerProfile.contactPhone}</p>
            </div>

            <div className='border-l-4 border-orange-200 pl-4 flex flex-col gap-2'>
              <label className='text-sm font-medium text-muted-foreground'>Email</label>
              <p className='text-sm font-mono'>{partnerProfile.contactEmail}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Условия сотрудничества */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Building className='h-5 w-5' />
            Условия сотрудничества
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='border-l-4 border-yellow-200 pl-4 flex flex-col gap-2'>
            <label className='text-sm font-medium text-muted-foreground'>Скидка (%)</label>
            <p className='text-sm font-medium'>
              {profile.sale !== null && profile.sale !== undefined
                ? `${(profile.sale * 100).toFixed(2).replace(/\.?0+$/, '')}%`
                : 'Не указана'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Дополнительная информация */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Building className='h-5 w-5' />
            Дополнительная информация
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='border-l-4 border-blue-200 pl-4 flex flex-col gap-2'>
            <label className='text-sm font-medium text-muted-foreground'>Веб-сайт</label>
            <p className='text-sm'>{partnerProfile.website || 'Не указан'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
