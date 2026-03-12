
'use client';

import Image from 'next/image';
import React from 'react';
import { Button } from '@shared/ui/forms/button';
import { type QueueStatusResponse } from '@shared/api/driver-queue';
import DriverLocation from './driver-location-block';

interface DriverStatusCardProps {
  queueData: QueueStatusResponse | null;
  isInQueue: boolean;
  isLoading: boolean;
  error: string | null;
  leaveQueue: () => Promise<void>;
}

export function DriverStatusCard({
  queueData,
  isInQueue,
  isLoading,
  error,
  leaveQueue
}: DriverStatusCardProps) {

  const handleToggleQueue = async () => {
    if (isInQueue) {
      await leaveQueue();
    } else {
      // Отправляем событие для открытия модалки выбора локации
      window.dispatchEvent(new CustomEvent('openLocationModal'));
    }
  };

  const _formatJoinedTime = (dateString: string) => {
    const date = new Date(dateString);

    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const queue = queueData?.position || 0

  // Показываем loading состояние пока не получили ответ от API
  if (isLoading) {
    return (
      <div className='h-full flex flex-col relative overflow-hidden rounded-2xl bg-white'>
        <div className='relative z-10 flex flex-col h-full p-3 sm:p-4'>
          {/* Центральная часть - skeleton */}
          <div className='flex-1 flex flex-col items-center justify-center px-2 sm:px-4'>
            <div className='w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-gray-200 animate-pulse mb-4' />
            <div className='w-32 h-4 bg-gray-200 rounded animate-pulse mb-2' />
            <div className='w-24 h-3 bg-gray-200 rounded animate-pulse' />
          </div>

          {/* Нижняя секция - skeleton кнопки */}
          <div className='mt-auto px-1 sm:px-2 pb-1 sm:pb-2'>
            <div className='w-full h-12 sm:h-14 bg-gray-200 rounded-xl animate-pulse' />
          </div>
        </div>
      </div>
    );
  }

  // Показываем ошибку если есть
  if (error) {
    return (
      <div className='h-full flex flex-col relative overflow-hidden rounded-2xl bg-white'>
        <div className='relative z-10 flex flex-col h-full p-3 sm:p-4'>
          <div className='flex-1 flex flex-col items-center justify-center px-2 sm:px-4'>
            <div className='text-center'>
              <p className='text-red-600 text-sm sm:text-base font-medium mb-4'>
                Ошибка загрузки данных
              </p>
              <p className='text-gray-500 text-xs sm:text-sm'>
                {error}
              </p>
            </div>
          </div>

          <div className='mt-auto px-1 sm:px-2 pb-1 sm:pb-2'>
            <Button
              onClick={() => window.history.back()}
              className='w-full h-12 sm:h-14 text-sm sm:text-base font-bold rounded-xl bg-gray-600 hover:bg-gray-700 text-white shadow-lg transition-all duration-200 active:scale-95 touch-manipulation'
            >
              Назад
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-[#F9F9F9] h-full flex flex-col relative rounded-2xl'>
      {/* Фоновое изображение - показываем только когда НЕ в очереди */}
      {!isInQueue && (
        <div className='absolute inset-0'>
          <Image
            src='/background/backgroundDriver.png'
            alt='Driver Background'
            fill
            className='object-cover rounded-2xl'
            priority
          />
        </div>
      )}

      {/* Контент поверх фона */}
      <div className='relative z-10 flex flex-col h-full p-3 sm:p-4'>

        {/* Центральная часть - растягивается с возможностью скролла */}
        <div className='flex-1 flex flex-col items-center justify-center px-2 sm:px-4 overflow-y-auto'>
          {isInQueue ? (
            <div className='text-center w-full'>
              {/* Анимированный спиннер с позицией в очереди */}
              <div className='relative mb-4 sm:mb-6 mx-auto w-fit'>
                {/* SVG спиннер с градиентом */}
                <div className='relative w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40'>
                  <svg
                    className='w-full h-full'
                    viewBox='0 0 100 100'
                    style={{
                      animation: 'spin 2s linear infinite'
                    }}
                  >
                    {/* Градиент */}
                    <defs>
                      <linearGradient id='spinnerGradient' x1='0%' y1='0%' x2='100%' y2='0%'>
                        <stop offset='0%' stopColor='#A3BCFF' />
                        <stop offset='100%' stopColor='#0047FF' />
                      </linearGradient>
                    </defs>

                    {/* Фоновый круг */}
                    <circle
                      cx='50'
                      cy='50'
                      r='40'
                      fill='none'
                      stroke='#e5e7eb'
                      strokeWidth='10'
                    />

                    {/* Анимированная дуга */}
                    <circle
                      cx='50'
                      cy='50'
                      r='40'
                      fill='none'
                      stroke='url(#spinnerGradient)'
                      strokeWidth='10'
                      strokeLinecap='round'
                      strokeDasharray='63 189'
                      transform='rotate(-90 50 50)'
                    />
                  </svg>

                  {/* Номер позиции в центре */}
                  <div className='absolute inset-0 flex items-center justify-center'>
                    <span className='text-2xl sm:text-3xl md:text-4xl font-bold text-blue-600'>
                      {queue + 1}
                    </span>
                  </div>
                </div>
              </div>

              {/* Текст "Ожидайте вы на очереди" */}
              <div className='text-center mb-4'>
                <p className='text-gray-700 text-sm sm:text-base font-medium'>Ожидайте вы на очереди</p>

              </div>
            </div>
          ) : (
            /* Пустое место для машины из фонового изображения */
            <div className='w-full h-full' >
              <div className="h-8 flex justify-between">
                <p className='text-[14px] text-[#92929D]'>Активные заявки</p>
                <div>
                  <p className='text=[#000000] text-[10px]'>Местонахождение</p>
                  <DriverLocation />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Нижняя секция */}
        <div className='mt-auto px-1 sm:px-2 pb-1 sm:pb-2'>
          <Button
            onClick={handleToggleQueue}
            disabled={isLoading}
            className={`w-full text-[16px] text-[#FFFFFF] py-[20px] px-[40px] sm:text-base font-medium rounded-[10px] text-white shadow-lg transition-all duration-200 active:scale-95 touch-manipulation ${isInQueue
              ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-400'
              : 'bg-[#0047FF] hover:bg-blue-700 disabled:bg-blue-400'
              }`}
          >
            {isLoading ? (
              <div className='flex items-center justify-center gap-2'>
                <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                <span className='text-sm sm:text-base'>Обновление...</span>
              </div>
            ) : isInQueue ? (
              'Выйти с линии'
            ) : (
              'Готов к заказу'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
