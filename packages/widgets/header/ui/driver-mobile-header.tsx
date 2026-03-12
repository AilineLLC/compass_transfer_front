'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/ui/data-display/avatar';
import { useProfileData } from '@features/my-profile';

export function DriverMobileHeader() {
  const { profile, isLoading } = useProfileData();

  if (isLoading) {
    return (
      <header className='bg-white shadow-sm border-b mx-2 mt-2 px-3 py-3 rounded-2xl'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2 flex-1 min-w-0'>
            <div className='w-10 h-10 bg-gray-200 rounded-full animate-pulse flex-shrink-0' />
            <div className='space-y-1 flex-1 min-w-0'>
              <div className='w-24 h-4 bg-gray-200 rounded animate-pulse' />
              <div className='w-32 h-3 bg-gray-200 rounded animate-pulse' />
            </div>
          </div>
          <div className='w-16 h-8 bg-gray-200 rounded animate-pulse flex-shrink-0' />
        </div>
      </header>
    );
  }

  return (
    <header className='bg-[#F9F9F9] mx-2 mt-2 relative overflow-hidden rounded-[20px]'>
      <div className='flex items-center justify-between relative z-5'>
        {/* Профиль водителя */}
        <div className='flex items-center p-3 gap-2 flex-1 min-w-0'>
          <Avatar className='w-[50px] h-[50px] flex-shrink-0'>
            <AvatarImage src={profile?.avatarUrl || ''} alt={profile?.fullName || 'User'} />
            <AvatarFallback className='bg-blue-100 text-blue-600 font-medium text-sm' >
              {profile?.fullName?.split(' ').map(name => name[0]).join('') || 'U'}
            </AvatarFallback>
          </Avatar>

          <div className='flex flex-col min-w-0 flex-1'>
            <div className='flex items-center gap-2'>
              <h1 className='font-medium text-[##000000] text-[14px] leading-tight max-w-[180px] break-words'>
                {profile?.fullName}
              </h1>
            </div>
            <div className='flex items-center gap-1'>
              <span className='text-[10px] text-[#92929D] font-medium truncate'>
                {profile?.phoneNumber ?
                  profile.phoneNumber.replace(/(\+996)(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4') :
                  profile?.phoneNumber
                }
              </span>
            </div>
          </div>
        </div>

        {/* Вместо локальной картинки (нет в репозитории) показываем компактный бейдж */}
        <div className='flex-shrink-0 ml-1 pr-3'>
          <div className='px-2 py-1 rounded-full bg-white/70 border text-[10px] text-[#92929D] whitespace-nowrap'>
            HongQi E-QM5
          </div>
        </div>
      </div>
    </header>
  );
}
