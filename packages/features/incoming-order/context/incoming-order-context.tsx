'use client';

import { useRouter, usePathname } from 'next/navigation';
import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { toast } from '@shared/lib/conditional-toast';
import { driverOrderApi } from '@shared/api/orders';
import type { SignalREventData } from '@shared/hooks/signal/types';
import { useSignalR } from '@shared/hooks/signal/useSignalR';
import { useNotificationSound } from '@features/notifications';

interface IncomingOrderContextType {
  currentOrderId: string | null;
  isModalOpen: boolean;
  showOrder: (orderId: string) => void;
  hideOrder: () => void;
  acceptOrder: (orderId: string, onOrderAccepted?: () => void) => Promise<void>;
}

const IncomingOrderContext = createContext<IncomingOrderContextType | undefined>(undefined);

interface IncomingOrderProviderProps {
  children: ReactNode;
  onOrderAccepted?: (orderId: string) => void;
}

export function IncomingOrderProvider({ children, onOrderAccepted }: IncomingOrderProviderProps) {
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { playSound, stopSound } = useNotificationSound();
  const { on, off } = useSignalR();
  const router = useRouter();
  const pathname = usePathname();

  const showOrder = useCallback((orderId: string) => {
    setCurrentOrderId(orderId);
    setIsModalOpen(true);
    // Звук запускается в useEffect ниже
  }, []);

  const hideOrder = useCallback(() => {
    // Закрываем модальное окно и останавливаем звук
    setIsModalOpen(false);
    setCurrentOrderId(null);
    stopSound(); // Останавливаем звуковое уведомление
    
    // ИСПРАВЛЕНО: hideOrder НЕ должен вызывать навигацию!
    // Навигация только при принятии заказа, не при закрытии/автозакрытии
  }, [stopSound]);

  const acceptOrder = useCallback(async (orderId: string, _onOrderAccepted?: () => void) => {
    try {
      stopSound(); // Останавливаем звук при принятии заказа

      // Принимаем заказ
      await driverOrderApi.acceptInstantOrder(orderId);

      // Показываем успешное уведомление
      toast.success('✅ Заказ успешно принят!');

      // Закрываем модальное окно без навигации
      setIsModalOpen(false);
      setCurrentOrderId(null);
      
      _onOrderAccepted?.();
      onOrderAccepted?.(orderId);

      // Умная навигация с задержкой для показа успеха
      setTimeout(() => {
        if (pathname === '/') {
          window.location.reload();
        } else {
          router.push('/');
        }
      }, 1500); // 1.5 секунды задержки для показа успешного принятия
    } catch {
      toast.error('❌ Ошибка принятия заказа:');
    }
  }, [stopSound, onOrderAccepted, pathname, router]);

  // Обработчик SignalR события для входящих заказов
  useEffect(() => {
    // IncomingOrderProvider: Настройка SignalR слушателей

    const handleRideRequest = (notification: SignalREventData) => {
      // Получен входящий заказ

      // TODO: Добавить проверку активного заказа через API если нужно
      // Пока что разрешаем показывать все входящие заказы

      // Проверяем, что уведомление содержит orderId (используем type guard)
      if (notification && typeof notification === 'object' && 'orderId' in notification && notification.orderId) {
        // Показываем модальное окно с orderId - модальное окно само получит данные
        showOrder(notification.orderId as string);
      } else {
        // Неверная структура уведомления - ожидался orderId на верхнем уровне
      }
    };

    on('RideRequest', handleRideRequest);

    return () => {
      off('RideRequest', handleRideRequest);
    };
  }, [on, off, showOrder]);

  // Эффект для воспроизведения звука при появлении модального окна
  useEffect(() => {
    if (isModalOpen && currentOrderId) {
      playSound();
    }
  }, [isModalOpen, currentOrderId, playSound]);

  // УДАЛЕН: дублирующий таймер автозакрытия
  // Таймер автозакрытия теперь только в модальном окне для избежания конфликтов



  const value: IncomingOrderContextType = {
    currentOrderId,
    isModalOpen,
    showOrder,
    hideOrder,
    acceptOrder,
  };

  return (
    <IncomingOrderContext.Provider value={value}>
      {children}
    </IncomingOrderContext.Provider>
  );
}

export function useIncomingOrder() {
  const context = useContext(IncomingOrderContext);

  if (context === undefined) {
    throw new Error('useIncomingOrder должен использоваться в IncomingOrderProvider');
  }
  
  return context;
}
