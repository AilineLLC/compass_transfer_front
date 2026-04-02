'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { orderService, type GetOrderDTO } from '@shared/api/orders';
import { driverQueueApi } from '@shared/api/driver-queue';
import { ridesApi } from '@shared/api/rides/rides-api';
import { ActiveOrderCard } from '@features/active-ride';
import { useDriverQueue } from '@features/driver-queue';
import { LocationSelectionModal } from '@features/driver-queue/components/location-selection-modal';
import DriverStatusBlock from './components/driver-status-block';
import { DriverStatusCard } from './components/driver-status-card';

export default function DriverDashboardPage() {
  const [currentOrder, setCurrentOrder] = useState<GetOrderDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);
  const [isDriverLocationModalOpen, setIsDriverLocationModalOpen] = useState(false);

  // Используем данные из useDriverQueue вместо дублирования запросов
  const {
    queueData,
    isInQueue,
    isLoading: queueIsLoading,
    error: queueError,
    joinQueue,
    leaveQueue,
    refetch: refetchQueue
  } = useDriverQueue();
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  const handleLocationSelect = useCallback(async (locationId: string) => {
    try {
      await joinQueue(locationId)
    } catch {
      // Ошибка уже обрабатывается в useDriverQueue
    }
  }, [joinQueue]);

  // Вспомогательная функция для загрузки активного заказа с прямыми API-вызовами
  // (не зависит от stale-состояния queueData)
  const fetchOrderDirectly = useCallback(async (): Promise<GetOrderDTO | null> => {
    let orderData: GetOrderDTO | null = null;

    // Шаг 1: свежий статус очереди напрямую через API
    try {
      const freshQueueData = await driverQueueApi.getQueueStatus();
      if (freshQueueData?.orderId) {
        orderData = await orderService.getOrderById(freshQueueData.orderId);
      } else if (freshQueueData && 'id' in freshQueueData) {
        orderData = freshQueueData as unknown as GetOrderDTO;
      }
    } catch {
      // Очередь недоступна, переходим к следующему шагу
    }

    // Шаг 2: фолбэк через назначенные поездки.
    // getMyAssignedRides надёжнее — в ответе всегда есть ride.status.
    // Показываем заказ только если поездка принята водителем (Accepted/Arrived/InProgress).
    // Requested = назначен но НЕ принят → не показываем в ActiveOrderCard.
    if (!orderData) {
      try {
        const assignedRidesResponse = await ridesApi.getMyAssignedRides();
        const acceptedStatuses = ['Accepted', 'Arrived', 'InProgress'];
        const completedStatuses = ['Completed', 'Cancelled', 'Expired'];

        const activeRide = assignedRidesResponse.data.find(ride =>
          acceptedStatuses.includes(ride.status) &&
          !completedStatuses.includes(ride.orderStatus)
        );

        if (activeRide?.orderId) {
          orderData = await orderService.getOrderById(activeRide.orderId);
        }
      } catch {
        // Ошибка фолбэка — заказа нет
      }
    }

    // Шаг 3: не показываем завершённые/отменённые заказы
    if (orderData && ['Completed', 'Cancelled', 'Expired'].includes(orderData.status)) {
      orderData = null;
    }

    return orderData;
  }, []);

  // Функция для получения активного заказа на основе данных из очереди
  const fetchActiveOrder = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const orderData = await fetchOrderDirectly();
      setCurrentOrder(orderData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [fetchOrderDirectly]);

  // Функция для обновления после действий водителя.
  // Делает прямые API-вызовы, чтобы избежать гонки состояний с устаревшим queueData.
  const handleStatusUpdate = useCallback(async () => {
    try {
      const orderData = await fetchOrderDirectly();
      setCurrentOrder(orderData);
      // Обновляем состояние хука очереди в фоне
      refetchQueue();
    } catch (err) {
      console.error('Ошибка при обновлении статуса:', err);
    }
  }, [fetchOrderDirectly, refetchQueue]);

  useEffect(() => {
    fetchActiveOrder();
  }, [fetchActiveOrder]);

  // Слушатель события принятия заказа
  useEffect(() => {
    const handleOrderAccepted = () => {
      // Обновляем данные при получении события принятия заказа
      // Используем handleStatusUpdate вместо fetchActiveOrder, чтобы сначала обновить очередь
      handleStatusUpdate();
    };

    const handleOpenLocationModal = () => {
      setIsLocationModalOpen(true);
    };

    const handleOpenDriverLocationModal = () => {
      setIsDriverLocationModalOpen(true);
    };

    window.addEventListener('orderAccepted', handleOrderAccepted);
    window.addEventListener('openLocationModal', handleOpenLocationModal);
    window.addEventListener('openDriverLocationModal', handleOpenDriverLocationModal);

    return () => {
      window.removeEventListener('orderAccepted', handleOrderAccepted);
      window.removeEventListener('openLocationModal', handleOpenLocationModal);
      window.removeEventListener('openDriverLocationModal', handleOpenDriverLocationModal);
    };
  }, [handleStatusUpdate]);

  // Функции для модалки локации
  const [currentLocation, setCurrentLocation] = useState('На линии');

  const locations = [
    {
      id: 'airport',
      label: 'Аэропорт',
      color: 'bg-blue-500'
    },
    {
      id: 'ala-archa',
      label: 'Ала-Арча',
      color: 'bg-green-500'
    },
    {
      id: 'online',
      label: 'На линии',
      color: 'bg-orange-500'
    }
  ];

  const updateLocation = async (newLocation: string) => {
    setCurrentLocation(newLocation);
    setIsDriverLocationModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className='h-[calc(100vh-80px)] flex flex-col p-4 space-y-4'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Главная</h1>
        </div>
        <div className='flex-1 flex items-center justify-center'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto' />
            <p className='mt-2 text-gray-600'>Загрузка...</p>
          </div>
        </div>
      </div>
    );
  }

  if (currentOrder) {
    return (
      <div className='p-4'>
        <ActiveOrderCard
          order={currentOrder}
          onStatusUpdate={handleStatusUpdate}
        />
      </div>
    );
  }

  return (
    <div className='h-[calc(100vh-80px)] flex flex-col p-4'>
      {/* Основной контент - занимает всё доступное место */}
      <div className='flex-1 flex flex-col min-h-0 space-y-4'>
        {/* DriverStatusCard занимает основное место */}
        <div className='flex-1 min-h-0 flex flex-col'>
          <DriverStatusCard
            queueData={queueData}
            isInQueue={isInQueue}
            isLoading={queueIsLoading}
            error={queueError}
            leaveQueue={leaveQueue}
          />
        </div>

        {/* DriverStatusBlock занимает столько места, сколько нужно */}
        <div className='flex-shrink-0'>
          <DriverStatusBlock />

          {/* Модалка DriverLocation на том же уровне что и DriverStatusBlock */}
          {isDriverLocationModalOpen && (
                <div
                  className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
                  onClick={() => setIsDriverLocationModalOpen(false)}
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 2147483647,
                    WebkitTransform: 'translate3d(0,0,0)',
                    transform: 'translate3d(0,0,0)',
                    WebkitBackfaceVisibility: 'hidden',
                    backfaceVisibility: 'hidden'
                  }}
                >
                  <div
                    className="bg-white rounded-2xl p-6 w-64 shadow-xl"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      WebkitTransform: 'translate3d(0,0,0)',
                      transform: 'translate3d(0,0,0)'
                    }}
                  >
                    <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">
                      Выберите местоположение
                    </h3>
                    <div className="space-y-3">
                      {locations.map((location) => (
                        <button
                          key={location.id}
                          onClick={() => updateLocation(location.label)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${currentLocation === location.label
                            ? 'bg-blue-50 border-2 border-blue-200'
                            : 'hover:bg-gray-50 border-2 border-transparent'
                            }`}
                        >
                          <div
                            className={`w-3 h-3 rounded-full ${location.color}`}
                          ></div>
                          <span className="text-sm text-gray-900 font-medium">
                            {location.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
        </div>
      </div>

      <LocationSelectionModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onLocationSelect={handleLocationSelect}
      />
    </div>
  );
}