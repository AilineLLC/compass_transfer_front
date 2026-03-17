'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { driverQueueApi } from '@shared/api/driver-queue';
import { orderService, type GetOrderDTO } from '@shared/api/orders';
import { ridesApi } from '@shared/api/rides/rides-api';
import { logger } from '@shared/lib/logger';
import type { ScheduledRidesResponse } from '@entities/rides/interface';

interface ActiveRideContextType {
  activeRides: ScheduledRidesResponse | null;
  scheduledRides: ScheduledRidesResponse | null;
  currentOrder: GetOrderDTO | null;
  hasActiveRide: boolean;
  hasActiveOrder: boolean;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

const ActiveRideContext = createContext<ActiveRideContextType | undefined>(undefined);

export function ActiveRideProvider({ children }: { children: React.ReactNode }) {
  const [activeRides, setActiveRides] = useState<ScheduledRidesResponse | null>(null);
  const [scheduledRides, setScheduledRides] = useState<ScheduledRidesResponse | null>(null);
  const [currentOrder, setCurrentOrder] = useState<GetOrderDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Проверяем наличие активного заказа
  const hasActiveOrder = currentOrder !== null;

  // Проверяем наличие активной поездки (InProgress, Arrived)
  const hasActiveRide = activeRides?.data?.some(ride => 
    ride.status === 'Arrived' || 
    ride.status === 'InProgress'
  ) || false;

  // Загрузка активных заказов, активных и запланированных поездок
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Получаем назначенные поездки
      const allRidesResponse = await ridesApi.getMyAssignedRides();

      // Пытаемся получить активный заказ двумя способами:
      // 1. Через статус очереди (если водитель в очереди и получил orderId)
      // 2. Через API активных заказов (если водитель не в очереди, но имеет активный заказ)
      let orderData: GetOrderDTO | null = null;

      // Шаг 1: Пробуем получить orderId через статус очереди
      try {
        const queueStatus = await driverQueueApi.getQueueStatus();

        if (queueStatus?.orderId) {
          orderData = await orderService.getOrderById(queueStatus.orderId);
          logger.info('✅ ActiveRideProvider: Получен активный заказ из очереди', {
            orderId: queueStatus.orderId,
          });
        }
      } catch (queueError) {
        logger.info('ℹ️ ActiveRideProvider: Ошибка статуса очереди, переходим к API активных заказов');
      }

      // Шаг 2: Если заказ не найден через очередь — ищем среди уже загруженных поездок.
      // Accepted/Arrived/InProgress = водитель принял поездку.
      // Requested = назначен но НЕ принят → не показываем в ActiveOrderCard.
      if (!orderData) {
        try {
          const acceptedStatuses = ['Accepted', 'Arrived', 'InProgress'];
          const completedStatuses = ['Completed', 'Cancelled', 'Expired'];

          const activeRide = allRidesResponse.data.find(ride =>
            acceptedStatuses.includes(ride.status) &&
            !completedStatuses.includes(ride.orderStatus)
          );

          if (activeRide?.orderId) {
            orderData = await orderService.getOrderById(activeRide.orderId);
            logger.info('✅ ActiveRideProvider: Получен активный заказ через назначенные поездки', {
              orderId: orderData?.id,
              rideStatus: activeRide.status,
            });
          } else {
            logger.info('ℹ️ ActiveRideProvider: Принятых активных поездок не найдено');
          }
        } catch (rideOrderError) {
          logger.error('❌ ActiveRideProvider: Ошибка получения заказа по поездке:', rideOrderError);
        }
      }

      // Шаг 3: Не показываем завершённые/отменённые заказы
      if (orderData && ['Completed', 'Cancelled', 'Expired'].includes(orderData.status)) {
        orderData = null;
      }

      // Разделяем поездки на активные (InProgress, Arrived) и запланированные (Accepted, Requested, Searching)
      const activeRidesData = {
        ...allRidesResponse,
        data: allRidesResponse.data.filter(ride => 
          ride.status === 'Arrived' || ride.status === 'InProgress'
        )
      };
      
      const scheduledRidesData = {
        ...allRidesResponse,
        data: allRidesResponse.data.filter(ride => 
          ride.status === 'Accepted' || 
          ride.status === 'Requested' || 
          ride.status === 'Searching'
        )
      };

      // Устанавливаем состояние
      logger.info('🔧 ActiveRideProvider: Устанавливаем состояние', {
        orderData: orderData,
        orderDataId: orderData?.id || null,
        orderDataStatus: orderData?.status || null,
        willSetCurrentOrder: !!orderData
      });

      setCurrentOrder(orderData);
      setActiveRides(activeRidesData);
      setScheduledRides(scheduledRidesData);

      logger.info('✅ ActiveRideProvider: Данные успешно загружены', {
        hasActiveOrder: !!orderData,
        activeOrderId: orderData?.id || null,
        activeRides: activeRidesData?.data?.length || 0,
        scheduledRides: scheduledRidesData?.data?.length || 0,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      
      setError(errorMessage);
      logger.error('❌ ActiveRideProvider: Ошибка загрузки данных:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);



  // Загружаем данные при монтировании
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Автоматическое обновление каждые 30 секунд
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchData]);

  const value: ActiveRideContextType = {
    activeRides,
    scheduledRides,
    currentOrder,
    hasActiveRide,
    hasActiveOrder,
    isLoading,
    error,
    refreshData: fetchData,
  };

  return (
    <ActiveRideContext.Provider value={value}>
      {children}
    </ActiveRideContext.Provider>
  );
}

export function useActiveRide(): ActiveRideContextType {
  const context = useContext(ActiveRideContext);
  
  if (context === undefined) {
    throw new Error('useActiveRide must be used within an ActiveRideProvider');
  }

  return context;
}
