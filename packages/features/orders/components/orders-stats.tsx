'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { ordersApi, type OrderStatsResponse } from '@shared/api/orders';
import { useUserRole } from '@shared/contexts/user-role-context';
import { useSignalR } from '@shared/hooks/signal/useSignalR';
import { orderStatsLabels, orderStatsColors } from '@entities/orders';
import { Role } from '@entities/users/enums';

interface OrderStatsProps {
  className?: string;
  activeStatus?: string | null;
}

export function OrdersStats({ className, activeStatus }: OrderStatsProps) {
  const [stats, setStats] = useState<OrderStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { userRole } = useUserRole();
  const signalR = useSignalR();

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Для партнеров используем API для статистики созданных ими заказов
      const data =
        userRole === Role.Partner
          ? await ordersApi.getMyCreatorOrderStats()
          : await ordersApi.getOrderStats();

      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки статистики');
    } finally {
      setLoading(false);
    }
  }, [userRole]);

  // Загрузка статистики при монтировании
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Подписка на SignalR события для автоматического обновления статистики
  useEffect(() => {
    if (!signalR.isConnected) return;

    const handleOrderEvent = () => {
      loadStats();
    };

    signalR.on('New', handleOrderEvent);

    return () => {
      signalR.off('New', handleOrderEvent);
    };
  }, [signalR, loadStats]);

  // Преобразуем ключ статистики в значение статуса для API
  const statusMap: Record<keyof OrderStatsResponse, string> = {
    pending: 'Pending',
    scheduled: 'Scheduled',
    inProgress: 'InProgress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    expired: 'Expired',
  };

  // Функция для определения активного статуса
  const isActiveStatus = (status: keyof OrderStatsResponse) => {
    return activeStatus === statusMap[status];
  };

  // Функция для получения цвета обводки активного статуса
  const getActiveRingColor = (status: keyof OrderStatsResponse) => {
    const ringColors = {
      pending: 'ring-yellow-400',
      scheduled: 'ring-1 ring-blue-400',
      inProgress: 'ring-1 ring-green-400',
      completed: 'ring-1 ring-emerald-400',
      cancelled: 'ring-1 ring-red-400',
      expired: 'ring-1 ring-orange-400',
    };

    return ringColors[status];
  };

  const handleStatClick = (status: keyof OrderStatsResponse) => {
    const statusValue = statusMap[status];
    const params = new URLSearchParams();

    params.set('status', statusValue);

    const newUrl = `/orders?${params.toString()}`;

    router.push(newUrl);
  };

  const handleShowAll = () => {
    router.push('/orders');
  };

  if (loading) {
    return (
      <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 ${className || ''}`}>
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className='bg-gray-50 border border-gray-200 rounded-lg p-4 animate-pulse'
          >
            <div className='h-8 bg-gray-200 rounded mb-2' />
            <div className='h-4 bg-gray-200 rounded' />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-4 ${className || ''}`}>
        <p className='text-red-600'>Ошибка загрузки статистики: {error}</p>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const total = (Object.keys(stats) as Array<keyof OrderStatsResponse>).reduce(
    (sum, key) => sum + stats[key],
    0,
  );
  const isAllActive = !activeStatus;

  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 ${className || ''}`}>
      {/* Кнопка «Все» */}
      <div
        onClick={handleShowAll}
        className={`
          flex flex-row items-center justify-start gap-2 border rounded-lg p-1 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105
          bg-gray-50 border-gray-200 text-gray-700
          ${isAllActive ? 'ring-4 ring-gray-400 ring-offset-2 shadow-xl' : ''}
        `}
      >
        <div className='flex items-center justify-center min-w-8 h-8 px-1 border border-gray-400 rounded-full'>
          <span className='text-sm font-bold'>{total.toLocaleString('ru-RU')}</span>
        </div>
        <div className='text-xs font-medium text-center'>Все</div>
      </div>

      {(Object.keys(stats) as Array<keyof OrderStatsResponse>).map(
        status =>
          status !== 'pending' && (
            <div
              key={status}
              onClick={() => handleStatClick(status)}
              className={`
              flex flex-row items-center justify-start gap-2 border rounded-lg p-1 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105
              ${orderStatsColors[status]}
              ${isActiveStatus(status) ? `ring-4 ${getActiveRingColor(status)} ring-offset-2 shadow-xl` : ''}
              ${status === 'expired' && stats[status] > 0 ? 'animate-pulse [animation-duration:3s]' : ''}
            `}
            >
              <div className='flex items-center justify-center min-w-8 h-8 px-1 border border-gray-400 border-current rounded-full'>
                <span className='text-sm font-bold'>{stats[status].toLocaleString('ru-RU')}</span>
              </div>
              <div className='text-xs font-medium text-center'>{orderStatsLabels[status]}</div>
            </div>
          ),
      )}
    </div>
  );
}
