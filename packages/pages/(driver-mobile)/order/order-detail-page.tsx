'use client';

import { ArrowLeft, Navigation, MapPin, Clock, User } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@shared/ui/forms/button';
import { orderNumberToString } from '@shared/utils/orderNumberConverter';
import type { GetOrderDTO } from '@entities/orders/interface/GetOrderDTO';

interface OrderDetailPageProps {
  order: GetOrderDTO;
  onBack: () => void;
}

export function OrderDetailPage({ order, onBack }: OrderDetailPageProps) {
  const [selectedMapService, setSelectedMapService] = useState<string | null>(null);

  // Получаем начальную и конечную точки
  const startLocation = order.waypoints?.[0]?.location;
  const endLocation = order.waypoints?.[order.waypoints.length - 1]?.location;

  // Функции для открытия карт
  const openInYandexMaps = () => {
    if (!startLocation || !endLocation) return;
    
    const url = `https://yandex.ru/maps/?rtext=${startLocation.latitude},${startLocation.longitude}~${endLocation.latitude},${endLocation.longitude}&rtt=auto`;
    
    window.open(url, '_blank');
  };

  const openInGoogleMaps = () => {
    if (!startLocation || !endLocation) return;
    
    const url = `https://www.google.com/maps/dir/${startLocation.latitude},${startLocation.longitude}/${endLocation.latitude},${endLocation.longitude}`;
    
    window.open(url, '_blank');
  };

  const openIn2GIS = () => {
    if (!startLocation || !endLocation) return;
    
    const url = `https://2gis.ru/directions?from=${startLocation.longitude},${startLocation.latitude}&to=${endLocation.longitude},${endLocation.latitude}`;
    
    window.open(url, '_blank');
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'Requested': 'Запрошена',
      'Searching': 'Поиск водителя',
      'Accepted': 'Принята водителем',
      'Arrived': 'Водитель прибыл',
      'InProgress': 'В процессе',
      'Completed': 'Завершена',
      'Cancelled': 'Отменена'
    };

    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'Requested': 'bg-yellow-100 text-yellow-800',
      'Searching': 'bg-blue-100 text-blue-800',
      'Accepted': 'bg-green-100 text-green-800',
      'Arrived': 'bg-purple-100 text-purple-800',
      'InProgress': 'bg-indigo-100 text-indigo-800',
      'Completed': 'bg-gray-100 text-gray-800',
      'Cancelled': 'bg-red-100 text-red-800'
    };

    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Заголовок */}
      <div className='bg-white shadow-sm border-b sticky top-0 z-10'>
        <div className='flex items-center p-4'>
          <Button
            variant='ghost'
            size='sm'
            onClick={onBack}
            className='mr-3 p-2'
          >
            <ArrowLeft className='w-5 h-5' />
          </Button>
          <div className='flex-1'>
            <h1 className='text-lg font-semibold'>Заказ #{orderNumberToString(order.orderNumber)}</h1>
            <div className='flex items-center mt-1'>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                {getStatusText(order.status)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className='p-4 space-y-6'>
        {/* Информация о заказе */}
        <div className='bg-white rounded-xl p-4 shadow-sm'>
          <h2 className='text-lg font-semibold mb-4 flex items-center'>
            <User className='w-5 h-5 mr-2 text-blue-600' />
            Информация о заказе
          </h2>
          
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <p className='text-sm text-gray-500'>Тип заказа</p>
              <p className='font-medium'>{order.type === 'Instant' ? 'Мгновенный' : 'Запланированный'}</p>
            </div>
            <div>
              <p className='text-sm text-gray-500'>Создан</p>
              <p className='font-medium'>
                {new Date(order.createdAt).toLocaleString('ru-RU')}
              </p>
            </div>
            {order.scheduledTime && (
              <div className='col-span-2'>
                <p className='text-sm text-gray-500'>Запланированное время</p>
                <p className='font-medium flex items-center'>
                  <Clock className='w-4 h-4 mr-1 text-blue-600' />
                  {new Date(order.scheduledTime).toLocaleString('ru-RU')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Маршрут */}
        <div className='bg-white rounded-xl p-4 shadow-sm'>
          <h2 className='text-lg font-semibold mb-4 flex items-center'>
            <MapPin className='w-5 h-5 mr-2 text-blue-600' />
            Маршрут
          </h2>

          <div className='space-y-4'>
            {/* Начальная точка */}
            <div className='flex items-start space-x-3'>
              <div className='w-4 h-4 rounded-full bg-green-500 mt-1 flex-shrink-0' />
              <div className='flex-1'>
                <p className='text-sm text-gray-500'>Откуда</p>
                <p className='font-medium text-gray-900'>
                  {startLocation?.name || startLocation?.address || 'Не указано'}
                </p>
                {startLocation?.address && startLocation?.name && (
                  <p className='text-sm text-gray-500'>{startLocation.address}</p>
                )}
              </div>
            </div>

            {/* Промежуточные точки */}
            {order.waypoints && order.waypoints.length > 2 && (
              <div className='space-y-3'>
                {order.waypoints.slice(1, -1).map((waypoint, index) => (
                  <div key={waypoint.locationId} className='flex items-start space-x-3'>
                    <div className='w-4 h-4 rounded-full bg-yellow-500 mt-1 flex-shrink-0' />
                    <div className='flex-1'>
                      <p className='text-sm text-gray-500'>Остановка {index + 1}</p>
                      <p className='font-medium text-gray-900'>
                        {waypoint.location.name || waypoint.location.address}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Конечная точка */}
            <div className='flex items-start space-x-3'>
              <div className='w-4 h-4 rounded-full bg-red-500 mt-1 flex-shrink-0' />
              <div className='flex-1'>
                <p className='text-sm text-gray-500'>Куда</p>
                <p className='font-medium text-gray-900'>
                  {endLocation?.name || endLocation?.address || 'Не указано'}
                </p>
                {endLocation?.address && endLocation?.name && (
                  <p className='text-sm text-gray-500'>{endLocation.address}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Кнопки для построения маршрута */}
        <div className='bg-white rounded-xl p-4 shadow-sm'>
          <h2 className='text-lg font-semibold mb-4 flex items-center'>
            <Navigation className='w-5 h-5 mr-2 text-blue-600' />
            Построить маршрут
          </h2>

          <div className='grid grid-cols-1 gap-3'>
            <Button
              onClick={openInYandexMaps}
              className='w-full bg-red-600 hover:bg-red-700 text-white'
            >
              Открыть в Яндекс.Картах
            </Button>
            
            <Button
              onClick={openInGoogleMaps}
              className='w-full bg-blue-600 hover:bg-blue-700 text-white'
            >
              Открыть в Google Maps
            </Button>
            
            <Button
              onClick={openIn2GIS}
              className='w-full bg-green-600 hover:bg-green-700 text-white'
            >
              Открыть в 2ГИС
            </Button>
          </div>
        </div>


        {/* Дополнительная информация */}
        {(order.distance || order.duration) && (
          <div className='bg-white rounded-xl p-4 shadow-sm'>
            <h2 className='text-lg font-semibold mb-4'>Дополнительная информация</h2>
            
            <div className='grid grid-cols-2 gap-4'>
              {order.distance && (
                <div>
                  <p className='text-sm text-gray-500'>Расстояние</p>
                  <p className='font-medium'>{order.distance.toFixed(1)} км</p>
                </div>
              )}
              {order.duration && (
                <div>
                  <p className='text-sm text-gray-500'>Длительность</p>
                  <p className='font-medium'>{order.duration}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
