'use client';

import { Car } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/layout/card';
import {
  CarTypeValues,
  ServiceClassValues,
  type CarType,
  type ServiceClass,
} from '@entities/tariffs/enums';
import type { GetTariffDTO } from '@entities/tariffs/interface';

interface TariffInfoCardProps {
  tariff: GetTariffDTO | null;
  userRole: 'admin' | 'operator' | 'partner' | 'driver';
  sale: number;
}

/**
 * Компонент для отображения информации о тарифе в сводке заказа
 */
export function TariffInfoCard({ tariff, userRole, sale }: TariffInfoCardProps) {
  // Получение типа автомобиля в читаемом формате
  const getCarTypeName = (type?: string): string => {
    if (!type) return 'Не указан';

    return CarTypeValues[type as CarType] || type;
  };

  // Получение класса сервиса в читаемом формате
  const getServiceClassName = (serviceClass?: string): string => {
    if (!serviceClass) return 'Не указан';

    return ServiceClassValues[serviceClass as ServiceClass] || serviceClass;
  };

  return (
    <Card className='mb-4'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Car className='h-5 w-5' />
          Тариф
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tariff ? (
          <div className='space-y-3'>
            {/* Название тарифа */}
            <div>
              <p className='text-gray-500 text-sm'>Название</p>
              <p className='font-medium text-lg'>{tariff.name}</p>
            </div>

            {/* Основная информация в две колонки */}
            <div className='grid grid-cols-2 gap-4 text-sm'>
              <div>
                <p className='text-gray-500'>Класс обслуживания</p>
                <p className='font-medium'>{getServiceClassName(tariff.serviceClass)}</p>
              </div>
              <div>
                <p className='text-gray-500'>Тип автомобиля</p>
                <p className='font-medium'>{getCarTypeName(tariff.carType)}</p>
              </div>
            </div>

            {/* Ценовая информация */}
            <div className='pt-2 border-t border-gray-100'>
              <div className='grid grid-cols-2 gap-4 text-sm'>
                <div>
                  <p className='text-gray-500'>Базовая цена</p>
                  <p className='font-medium'>{Math.round(tariff.basePrice * (1 - (sale || 0)))} сом</p>
                </div>
                <div>
                  <p className='text-gray-500'>Цена за минуту</p>
                  <p className='font-medium'>{Math.round(tariff.minutePrice * (1 - (sale || 0)))} сом</p>
                </div>
                <div>
                  <p className='text-gray-500'>Цена за км</p>
                  <p className='font-medium'>{Math.round(tariff.perKmPrice * (1 - (sale || 0)))} сом</p>
                </div>
                <div>
                  <div>
                    <p className='text-gray-500'>Бесплатное время ожидания</p>
                    <p className='font-medium'>{tariff.freeWaitingTimeMinutes} мин</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className='text-gray-500'>Тариф не выбран</p>
        )}
      </CardContent>
    </Card>
  );
}
