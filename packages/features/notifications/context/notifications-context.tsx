'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { notificationsApi, type GetNotificationDTO } from '@shared/api/notifications';
import { useSignalR } from '@shared/hooks/signal/useSignalR';
import { logger } from '@shared/lib';

interface NotificationsContextType {
  unreadCount: number;
  notifications: GetNotificationDTO[];
  isLoading: boolean;
  refreshUnreadCount: () => Promise<void>;
  markAsRead: (notificationIds: string[]) => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

interface NotificationsProviderProps {
  children: React.ReactNode;
}

export function NotificationsProvider({ children }: NotificationsProviderProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<GetNotificationDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { on, off } = useSignalR();

  // Функция для обновления количества непрочитанных уведомлений
  const refreshUnreadCount = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Загружаем первую страницу уведомлений для подсчета непрочитанных
      const result = await notificationsApi.getMyNotifications({
        size: 50, // Загружаем больше для точного подсчета
      });
      
      const allNotifications = result.data || [];
      const unreadNotifications = allNotifications.filter(n => !n.isRead);
      
      setNotifications(allNotifications);
      setUnreadCount(unreadNotifications.length);
      
      logger.info('Обновлено количество непрочитанных уведомлений:', unreadNotifications.length);
    } catch (error) {
      logger.error('Ошибка загрузки уведомлений:', error);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Функция для отметки уведомлений как прочитанных
  const markAsRead = useCallback(async (notificationIds: string[]) => {
    try {
      await notificationsApi.markAsRead(notificationIds);
      
      // Обновляем локальное состояние
      setNotifications(prev => 
        prev.map(notification => 
          notificationIds.includes(notification.id)
            ? { ...notification, isRead: true }
            : notification
        )
      );
      
      // Пересчитываем количество непрочитанных
      setNotifications(prev => {
        const newUnreadCount = prev.filter(n => !n.isRead).length;

        setUnreadCount(newUnreadCount);

        return prev;
      });
      
      logger.info('Уведомления отмечены как прочитанные:', notificationIds);
    } catch (error) {
      logger.error('Ошибка отметки уведомлений как прочитанных:', error);
      throw error;
    }
  }, []);

  // SignalR слушатель для уведомлений
  useEffect(() => {
    const handleNotificationUpdate = () => {
      logger.info('📨 Получено SignalR событие обновления уведомлений');
      refreshUnreadCount();
    };

    on('New', handleNotificationUpdate);

    return () => {
      off('New', handleNotificationUpdate);
    };
  }, [on, off, refreshUnreadCount]);

  // Загружаем уведомления только при инициализации
  useEffect(() => {
    refreshUnreadCount();
    // Убираем polling - будем обновлять через SignalR
  }, [refreshUnreadCount]);

  const contextValue: NotificationsContextType = {
    unreadCount,
    notifications,
    isLoading,
    refreshUnreadCount,
    markAsRead,
  };

  return (
    <NotificationsContext.Provider value={contextValue}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotificationsContext(): NotificationsContextType {
  const context = useContext(NotificationsContext);

  if (context === undefined) {
    throw new Error('useNotificationsContext must be used within a NotificationsProvider');
  }
  
  return context;
}
