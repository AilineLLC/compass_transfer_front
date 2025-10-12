'use client';

import { useState } from 'react';
import {
  isDriverProfile,
  isAdminProfile,
  isOperatorProfile,
  isPartnerProfile,
  isTerminalProfile,
  isCustomerProfile,
} from '@entities/my-profile';
import {
  BasicInfoSection,
  RidesSection,
  MyPaymentsSection,
  AdminSection,
  CustomerSection,
  DriverSection,
  OperatorSection,
  PartnerSection,
  TerminalSection
} from '@entities/users';
import { useProfileData } from '@features/my-profile';
import {
  ProfileActions,
  ProfileError,
  ProfileHeader,
  ProfileLoading,
  ProfileTabs,
  type ProfileTab
} from '@features/users';

export function MeProfileView() {
  const { profile, isLoading, error, refetch } = useProfileData();
  const [activeTab, setActiveTab] = useState<ProfileTab>('basic');

  // Функция для открытия карты
  const openMapSheet = (data: {
    address: string;
    latitude?: number;
    longitude?: number;
    title?: string;
  }) => {
    // Если есть валидные координаты, открываем Яндекс Карты с точными координатами
    if (data.latitude && data.longitude && data.latitude !== 0 && data.longitude !== 0) {
      const yandexMapsUrl = `https://yandex.ru/maps/10309/bishkek/?ll=${data.longitude},${data.latitude}&z=16`;

      window.open(yandexMapsUrl, '_blank', 'noopener,noreferrer');
    } else {
      // Если координат нет, открываем поиск по адресу
      const searchQuery = encodeURIComponent(data.address);
      const yandexMapsSearchUrl = `https://yandex.ru/maps/10309/bishkek/?text=${searchQuery}`;

      window.open(yandexMapsSearchUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Функция для рендера роль-специфичной секции
  const renderRoleSpecificSection = () => {
    if (!profile) return null;

    if (isDriverProfile(profile)) {
      return <DriverSection profile={profile} openMapSheet={openMapSheet} />;
    }

    if (isAdminProfile(profile)) {
      return <AdminSection profile={profile} />;
    }

    if (isOperatorProfile(profile)) {
      return <OperatorSection profile={profile} />;
    }

    if (isPartnerProfile(profile)) {
      return <PartnerSection profile={profile} openMapSheet={openMapSheet} />;
    }

    if (isTerminalProfile(profile)) {
      return <TerminalSection profile={profile} openMapSheet={openMapSheet} />;
    }

    if (isCustomerProfile(profile)) {
      return <CustomerSection profile={profile} />;
    }

    return null;
  };

  const renderTabContent = () => {
    if (!profile) return null;

    switch (activeTab) {
      case 'basic':
        return (
          <>
            <BasicInfoSection profile={profile} />
            {renderRoleSpecificSection()}
          </>
        );
      case 'rides':
        return <RidesSection />;
      case 'payments':
        return <MyPaymentsSection />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return <ProfileLoading />;
  }

  if (error) {
    return <ProfileError error={error} onRetry={refetch} />;
  }

  if (!profile) {
    return <ProfileError error='Профиль не найден' onRetry={refetch} />;
  }

  return (
    <div className='pr-2 border rounded-2xl overflow-hidden shadow-sm h-full bg-white'>
      {/* Заголовок страницы */}
      <div className='overflow-y-auto h-full pl-4 pr-2'>
        <div className='flex items-center justify-between p-4'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>Мой профиль</h1>
            <p className='text-muted-foreground'>Просмотр и управление личной информацией</p>
          </div>
        </div>

        {/* Header на всю ширину */}
        <ProfileHeader profile={profile} />

        {/* Двухколоночный layout */}
        <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
          {/* Левая колонка - основная информация (3/4 ширины) */}
          <div className='lg:col-span-3 flex flex-col gap-6'>
            {/* Табы для переключения между секциями */}
            <div className='px-4'>
              <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} showPayments />
            </div>
            {/* Контент выбранной вкладки */}
            {renderTabContent()}
          </div>

          {/* Правая колонка - кнопки действий (1/4 ширины) */}
          <div className='lg:col-span-1'>
            <ProfileActions />
          </div>
        </div>
      </div>
    </div>
  );
}
