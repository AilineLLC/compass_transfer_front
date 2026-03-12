'use client';

import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ArrowLeft, Clock, CheckCircle, AlertCircle, Car, Info, AlertTriangle } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { notificationsApi, type GetNotificationDTO } from '@shared/api/notifications';
import { ordersApi } from '@shared/api/orders/orders-api';
import type { GetOrderDTO } from '@entities/orders/interface';
import { useNotificationActions } from '@features/notifications/hooks/use-notification-actions';
import { getNotificationCategory, NotificationCategory } from '@features/notifications/hooks/useNotifications';
import { useNotificationsContext } from '@features/notifications';

// Конфигурация категорий для отображения
const CATEGORY_CONFIG = {
  [NotificationCategory.ORDER]: {
    label: 'О заказе',
    icon: Car,
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
  },
  [NotificationCategory.IMPORTANT]: {
    label: 'Важная информация',
    icon: Info,
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
  },
  [NotificationCategory.WARNING]: {
    label: 'Предупреждения',
    icon: AlertTriangle,
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200',
  },
};

export default function NotificationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const notificationId = params.id as string;

  const [notification, setNotification] = useState<GetNotificationDTO | null>(null);
  const [orderData, setOrderData] = useState<GetOrderDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { toggleReadStatus } = useNotificationActions({
    onSuccess: () => {
      // Обновляем локальное состояние
      if (notification && !notification.isRead) {
        setNotification(prev => prev ? { ...prev, isRead: true } : null);
      }
    },
  });
  const { refreshUnreadCount } = useNotificationsContext();

  // Загрузка уведомления и данных заказа
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Получаем уведомление
        const notificationData = await notificationsApi.getNotificationById(notificationId);
        setNotification(notificationData);

        // Если есть orderId, получаем детальные данные заказа
        if (notificationData.orderId) {
          const orderDetails = await ordersApi.getOrder(notificationData.orderId);
          setOrderData(orderDetails);
        }

        // Автоматически отмечаем как прочитанное, если еще не прочитано
        if (!notificationData.isRead) {
          await toggleReadStatus(notificationData);
        }
        await refreshUnreadCount();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Ошибка загрузки данных';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    if (notificationId) {
      loadData();
    }
  }, [notificationId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGoBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <div className='min-h-full bg-gray-50 p-4'>
        <div className='max-w-md mx-auto'>
          
          {/* Заголовок с кнопкой назад */}
          <div className='mb-6 flex items-center'>
            <button
              onClick={handleGoBack}
              className='mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors'
            >
              <ArrowLeft className='w-6 h-6 text-gray-600' />
            </button>
            <h1 className='text-xl font-bold text-gray-900'>Уведомление</h1>
          </div>

          <div className='bg-white rounded-2xl p-8 text-center shadow-sm'>
            <div className='w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4' />
            <p className='text-gray-500'>Загрузка уведомления...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !notification) {
    return (
      <div className='min-h-full bg-gray-50 p-4'>
        <div className='max-w-md mx-auto'>
          {/* Заголовок с кнопкой назад */}
          <div className='mb-6 flex items-center'>
            <button
              onClick={handleGoBack}
              className='mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors'
            >
              <ArrowLeft className='w-6 h-6 text-gray-600' />
            </button>
            <h1 className='text-xl font-bold text-gray-900'>Уведомление</h1>
          </div>

          <div className='bg-white rounded-2xl p-8 text-center shadow-sm'>
            <AlertCircle className='w-16 h-16 text-red-300 mx-auto mb-4' />
            <h2 className='text-lg font-semibold text-gray-900 mb-2'>
              Ошибка загрузки
            </h2>
            <p className='text-gray-500 mb-4'>
              {error || 'Уведомление не найдено'}
            </p>
            <button
              onClick={handleGoBack}
              className='px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors'
            >
              Назад
            </button>
          </div>
        </div>
      </div>
    );
  }

  const category = getNotificationCategory(notification.type);
  const categoryConfig = CATEGORY_CONFIG[category];

  return (
    <div className='min-h-full bg-gray-50 p-4'>
      <div className='max-w-md mx-auto'>
        {/* Заголовок с кнопкой назад */}
        <div className='mb-6 flex items-center justify-between'>
          <div className='flex items-center'>
            <button
              onClick={handleGoBack}
              className='mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors'
            >
              <ArrowLeft className='w-6 h-6 text-gray-600' />
            </button>
            <h1 className='text-xl font-bold text-gray-900'>Назад</h1>
          </div>

          {/* Индикатор сервиса */}
          <div className='bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-sm font-medium'>
            Сервис
          </div>
        </div>

        {/* Основной контент уведомления */}
        <div className='bg-white rounded-2xl shadow-sm overflow-hidden'>
          {/* Категория уведомления */}
          <div className={`px-6 py-3 ${categoryConfig.bgColor} ${categoryConfig.borderColor} border-b`}>
            <div className='flex items-center'>
              <categoryConfig.icon className='w-5 h-5 mr-2' />
              <span className={`text-sm font-medium ${categoryConfig.textColor}`}>
                {categoryConfig.label}
              </span>
            </div>
          </div>

          {/* Содержимое */}
          <div className='p-6'>
            {/* Заголовок */}
            <div className='flex items-start justify-between mb-4'>
              <h2 className='text-lg font-bold text-gray-900 flex-1'>
                {orderData ? `Заказ #${orderData.id.slice(-8)}` : notification.title}
              </h2>
              <div className='ml-4 flex items-center'>
                {notification.isRead ? (
                  <CheckCircle className='w-5 h-5 text-green-500' />
                ) : (
                  <div className='w-3 h-3 bg-blue-500 rounded-full' />
                )}
              </div>
            </div>

            {/* Время */}
            <div className='flex items-center text-sm text-gray-500 mb-6'>
              <Clock className='w-4 h-4 mr-2' />
              {orderData?.createdAt ? formatDistanceToNow(new Date(orderData.createdAt), {
                addSuffix: true,
                locale: ru,
              }) : notification.createdAt && formatDistanceToNow(new Date(notification.createdAt), {
                addSuffix: true,
                locale: ru,
              })}
            </div>

            {/* Информация о заказе */}
            {orderData ? (
              <div className='space-y-4'>
                {/* Маршрут */}
                {(orderData.startLocationId || orderData.endLocationId) && (
                  <div>
                    <h3 className='text-sm font-semibold text-gray-700 mb-2'>Маршрут</h3>
                    <div className='space-y-2'>
                      {orderData.startLocationId && (
                        <div className='flex items-start'>
                          <div className='w-3 h-3 bg-green-500 rounded-full mt-1 mr-3 flex-shrink-0' />
                          <span className='text-sm text-gray-800'>Откуда: {orderData.startLocationId}</span>
                        </div>
                      )}
                      {orderData.endLocationId && (
                        <div className='flex items-start'>
                          <div className='w-3 h-3 bg-red-500 rounded-full mt-1 mr-3 flex-shrink-0' />
                          <span className='text-sm text-gray-800'>Куда: {orderData.endLocationId}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Статус заказа */}
                <div>
                  <h3 className='text-sm font-semibold text-gray-700 mb-2'>Статус</h3>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${orderData.status === 'Completed' ? 'bg-green-100 text-green-800' :
                    orderData.status === 'InProgress' ? 'bg-blue-100 text-blue-800' :
                      orderData.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                    }`}>
                    {orderData.status}
                  </span>
                </div>

                {/* Тип заказа */}
                <div>
                  <h3 className='text-sm font-semibold text-gray-700 mb-2'>Тип заказа</h3>
                  <span className='text-sm text-gray-800'>{orderData.type}</span>
                </div>

                {/* Цена */}
                <div>
                  <h3 className='text-sm font-semibold text-gray-700 mb-2'>Стоимость</h3>
                  <div className='space-y-1'>
                    <div className='text-sm text-gray-800'>
                      Предварительная: {orderData.initialPrice} сом
                    </div>
                    {orderData.finalPrice && (
                      <div className='text-sm text-gray-800 font-medium'>
                        Итоговая: {orderData.finalPrice} сом
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className='prose prose-sm max-w-none'>
                <div className='text-gray-800 leading-relaxed whitespace-pre-wrap'>
                  {notification.content || 'Содержимое уведомления отсутствует.'}
                </div>
              </div>
            )}

            {/* Дополнительная информация */}
            <div className='mt-6 pt-6 border-t border-gray-100'>
              <h3 className='text-sm font-semibold text-gray-700 mb-3'>
                Дополнительная информация
              </h3>
              <div className='space-y-2'>
                {notification.orderId && (
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-500'>ID заказа:</span>
                    <span className='text-gray-900 font-mono'>
                      {notification.orderId}
                    </span>
                  </div>
                )}
                {notification.rideId && (
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-500'>ID поездки:</span>
                    <span className='text-gray-900 font-mono'>
                      {notification.rideId}
                    </span>
                  </div>
                )}
                {orderData?.id && (
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-500'>Полный ID заказа:</span>
                    <span className='text-gray-900 font-mono text-xs'>
                      {orderData.id}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Подпись сервиса */}
            <div className='mt-8 pt-6 border-t border-gray-100 text-center'>
              <p className='text-sm text-gray-500'>
                [Название сервиса]
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
