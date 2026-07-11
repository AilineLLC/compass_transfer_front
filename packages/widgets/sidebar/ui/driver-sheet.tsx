'use client';

import { X, User as UserIcon, FileText, Car, Map, CheckCircle, Plus } from 'lucide-react';
import React from 'react';
import { Button } from '@shared/ui/forms/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@shared/ui/modals/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@shared/ui/modals/tooltip';
import type { GetDriverDTO } from '@entities/users/interface';
import {
  DriverMainInfo,
  DriverPassportInfo,
  DriverLicenseInfo,
  DriverPersonalInfo,
  DriverCarsInfo,
  DriverLocationInfo,
  DriverOrdersInfo,
} from '@features/sheet/driver-sheet/ui';

interface DriverSheetProps {
  isOpen: boolean;
  onClose: () => void;
  driver: GetDriverDTO | null;
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  activeOrderType: string;
  setActiveOrderType: (type: string) => void;
  onCarRemoved?: () => void;
}

export function DriverSheet({
  isOpen,
  onClose,
  driver,
  activeCategory,
  setActiveCategory,
  activeOrderType,
  setActiveOrderType,
  onCarRemoved,
}: DriverSheetProps) {
  // Категории информации о водителе
  const driverCategories = React.useMemo(
    () => [
      {
        id: 'main',
        label: 'Основная информация',
        icon: UserIcon,
      },
      {
        id: 'passport',
        label: 'Паспортные данные',
        icon: FileText,
      },
      {
        id: 'license',
        label: 'Водительское удостоверение',
        icon: CheckCircle,
      },
      {
        id: 'personal',
        label: 'Личная информация',
        icon: UserIcon,
      },
      {
        id: 'cars',
        label: 'Назначенные автомобили',
        icon: Car,
      },
      {
        id: 'location',
        label: 'Расположение на карте',
        icon: Map,
      },
      {
        id: 'orders',
        label: 'Заказы',
        icon: FileText,
      },
    ],
    [],
  );

  const renderContent = () => {
    if (!driver) return null;

    switch (activeCategory) {
      case 'main':
        return <DriverMainInfo driver={driver} />;
      case 'passport':
        return <DriverPassportInfo driver={driver} />;
      case 'license':
        return <DriverLicenseInfo driver={driver} />;
      case 'personal':
        return <DriverPersonalInfo driver={driver} />;
      case 'cars':
        return <DriverCarsInfo driver={driver} onCarRemoved={onCarRemoved} />;
      case 'location':
        return <DriverLocationInfo driver={driver} />;
      case 'orders':
        return (
          <DriverOrdersInfo
            driver={driver}
            activeOrderType={activeOrderType}
            setActiveOrderType={setActiveOrderType}
          />
        );
      default:
        return <DriverMainInfo driver={driver} />;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={open => !open && onClose()}>
      {driver && (
        <SheetContent className='w-[400px] sm:w-[540px] overflow-y-auto'>
          <SheetHeader className='flex flex-row items-center justify-between space-y-0 px-3'>
            <SheetTitle>Информация о водителе</SheetTitle>
            <div className='flex items-center gap-2'>
              <Button
                size='sm'
                className='bg-primary text-primary-foreground hover:bg-primary/90'
                onClick={() => {
                  // Переход на страницу создания заказа для водителя
                  window.open(`/orders/create?driver=${driver.id}`, '_blank');
                }}
              >
                <Plus className='h-4 w-4 mr-2' />
                Создать заказ водителю
              </Button>
              <Button variant='ghost' size='sm' onClick={onClose} className='h-8 w-8 p-0'>
                <X className='h-4 w-4' />
              </Button>
            </div>
          </SheetHeader>

          <div className='flex h-full gap-4 mt-4'>
            {/* Сайдбар с категориями */}
            <div className='w-16 border-r flex flex-col items-center justify-start gap-1 p-2'>
              {driverCategories.map(category => {
                const Icon = category.icon;

                return (
                  <Tooltip key={category.id}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setActiveCategory(category.id)}
                        className={`relative w-10 h-10 rounded-md flex items-center justify-center transition-colors ${
                          activeCategory === category.id
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted'
                        }`}
                      >
                        <Icon className='h-4 w-4' />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side='right' align='center'>
                      {category.label}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>

            {/* Основной контент */}
            <div className='flex-1'>{renderContent()}</div>
          </div>
        </SheetContent>
      )}
    </Sheet>
  );
}
