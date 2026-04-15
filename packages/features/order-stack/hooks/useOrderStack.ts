'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSignalR } from '@shared/hooks/signal/useSignalR';
import type { SignalREventData } from '@shared/hooks/signal/types';
import type { GetOrderDTO } from '@entities/orders/interface/GetOrderDTO';

export interface OrderStackItem {
  orderId: string;
  order: GetOrderDTO;
  receivedAt: number; // timestamp когда заказ был получен
  expiresAt: number; // timestamp когда заказ истекает (3 минуты)
}

const STORAGE_KEY = 'driver_order_stack';
const ORDER_EXPIRY_TIME = 3 * 60 * 1000; // 3 минуты в миллисекундах

export function useOrderStack() {
  const [orderStack, setOrderStack] = useState<OrderStackItem[]>([]);
  const { on, off } = useSignalR();

  // Загружаем заказы из localStorage при инициализации
  useEffect(() => {
    const loadOrderStack = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsedStack: OrderStackItem[] = JSON.parse(stored);
          // Фильтруем истекшие заказы
          const validStack = parsedStack.filter(item => item.expiresAt > Date.now());
          setOrderStack(validStack);
          
          // Обновляем localStorage если были удалены истекшие заказы
          if (validStack.length !== parsedStack.length) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(validStack));
          }
        }
      } catch (error) {
        console.error('Ошибка загрузки стакана заказов:', error);
        setOrderStack([]);
      }
    };

    loadOrderStack();
  }, []);

  // Сохраняем стакан в localStorage при изменении
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orderStack));
    } catch (error) {
      console.error('Ошибка сохранения стакана заказов:', error);
    }
  }, [orderStack]);

  // Добавляем заказ в стакан
  const addToStack = useCallback((order: GetOrderDTO) => {
    const now = Date.now();
    const newItem: OrderStackItem = {
      orderId: order.id,
      order,
      receivedAt: now,
      expiresAt: now + ORDER_EXPIRY_TIME,
    };

    setOrderStack(prev => {
      // Проверяем, что заказ еще не в стакане
      const exists = prev.some(item => item.orderId === order.id);
      if (exists) {
        return prev;
      }
      return [...prev, newItem];
    });
  }, []);

  // Удаляем заказ из стакана
  const removeFromStack = useCallback((orderId: string) => {
    setOrderStack(prev => prev.filter(item => item.orderId !== orderId));
  }, []);

  // Очищаем весь стакан
  const clearStack = useCallback(() => {
    setOrderStack([]);
  }, []);

  // Принимаем заказ из стакана (универсальная функция для принятия и удаления)
  const acceptOrderFromStack = useCallback(async (orderId: string, acceptOrderFn?: (orderId: string) => Promise<void>) => {
    try {
      // Если передан callback для принятия заказа, вызываем его
      if (acceptOrderFn) {
        await acceptOrderFn(orderId);
      }
      
      // Удаляем из стакана
      removeFromStack(orderId);
      return true;
    } catch (error) {
      console.error('Ошибка принятия заказа из стакана:', error);
      return false;
    }
  }, [removeFromStack]);

  // Обработчик уведомления об отмене заказа
  useEffect(() => {
    const handleCancelRideRequest = (notification: SignalREventData) => {
      if (notification && typeof notification === 'object' && 'orderId' in notification) {
        const orderId = notification.orderId as string;
        removeFromStack(orderId);
      }
    };

    const handleNew = (data: SignalREventData) => {
      const n = data as { type?: string; orderId?: string };
      // RideCancelled или OrderCancelled означает снятие заявки
      if (n?.type === 'RideCancelled' || n?.type === 'OrderCancelled') {
        handleCancelRideRequest(data);
      }
    };

    on('New', handleNew);

    return () => {
      off('New', handleNew);
    };
  }, [on, off, removeFromStack]);

  // Автоматическая очистка истекших заказов каждую минуту
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setOrderStack(prev => {
        const validStack = prev.filter(item => item.expiresAt > now);
        return validStack.length !== prev.length ? validStack : prev;
      });
    }, 60000); // Проверяем каждую минуту

    return () => clearInterval(cleanupInterval);
  }, []);

  return {
    orderStack,
    addToStack,
    removeFromStack,
    clearStack,
    acceptOrderFromStack,
  };
}
