'use client';

import { useEffect, useCallback, type ReactNode } from 'react';
import { useSignalR } from '@shared/hooks/signal/useSignalR';
import { logger } from '@shared/lib/logger';
import { NotificationContext, type NotificationContextType } from '@entities/notifications/context';
import { deduplicateNotificationsByOrder } from '@entities/notifications/utils';
import { useNotifications } from '@features/notifications/hooks';

// Простой тип для приоритета уведомлений
type NotificationPriority = 'order' | 'completed' | 'important' | 'warning';

// Функция для определения приоритета уведомления
const getNotificationPriority = (type: string): NotificationPriority => {
  switch (type) {
    case 'order_created':
    case 'order_updated':
    case 'order_assigned':
      return 'order';
    case 'order_completed':
    case 'order_cancelled':
      return 'completed';
    case 'system_maintenance':
    case 'urgent_message':
      return 'important';
    default:
      return 'warning';
  }
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const signalR = useSignalR();
  
  // Используем новый хук useNotifications - правильная архитектура!
  const {
    notifications,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    totalCount,
    unreadCount,
    actions: {
      loadNotifications,
      loadMore,
      refresh,
      markAsRead,
      deleteNotification,
      addOptimisticNotification,
    }
  } = useNotifications(20);


  // Дедуплицированные уведомления (убираем дубли по заказам)
  const deduplicatedNotifications = useCallback(() => {
    return deduplicateNotificationsByOrder(notifications);
  }, [notifications]);

  // Подсчет правильных счетчиков после дедупликации
  const deduplicatedCounts = useCallback(() => {
    const deduplicated = deduplicatedNotifications();
    const priorityCounts: Record<NotificationPriority, number> = {
      order: 0,
      completed: 0,
      important: 0,
      warning: 0,
    };
    let totalUnread = 0;

    deduplicated.forEach(notification => {
      if (!notification.isRead) {
        const priority = getNotificationPriority(notification.type);

        priorityCounts[priority]++;
        totalUnread++;
      }
    });

    return {
      priorityCounts,
      totalUnread,
      totalCount: deduplicated.length,
    };
  }, [deduplicatedNotifications]);

  const handleMarkAsRead = useCallback(async (id: string) => {
    try {
      await markAsRead(id);
      logger.info('✅ NotificationProvider.markAsRead успешно:', id);
    } catch (err) {
      logger.error('❌ NotificationProvider.markAsRead ошибка:', err);
    }
  }, [markAsRead]);

  const handleDeleteNotification = useCallback(async (id: string) => {
    try {
      await deleteNotification(id);
      logger.info('🗑️ NotificationProvider.deleteNotification успешно:', id);
    } catch (err) {
      logger.error('❌ NotificationProvider.deleteNotification ошибка:', err);
    }
  }, [deleteNotification]);

  // Подписка на новые уведомления через WebSocket
  useEffect(() => {
    if (!signalR.connection || !signalR.isConnected) return;

    const pendingTimers: ReturnType<typeof setTimeout>[] = [];

    const handleNewNotification = (data: unknown) => {
      logger.info('📨 NotificationProvider: получено новое уведомление через SignalR', data);

      if (data && typeof data === 'object' && 'id' in data) {
        const wsNotif = data as import('@shared/api/notifications').GetNotificationDTO;
        const isWsOnly = !wsNotif.id || wsNotif.id === '00000000-0000-0000-0000-000000000000';

        addOptimisticNotification({ ...wsNotif, isRead: false });

        // Для WS-only уведомлений (null UUID) не делаем refresh — их нет на сервере
        if (!isWsOnly) {
          const timer = setTimeout(() => { refresh(); }, 1500);
          pendingTimers.push(timer);
        }
      }
    };

    signalR.on('New', handleNewNotification);

    return () => {
      signalR.off('New', handleNewNotification);
      pendingTimers.forEach(t => clearTimeout(t));
    };
  }, [signalR, refresh, addOptimisticNotification]);

  // Автоматическая загрузка при монтировании
  useEffect(() => {
    loadNotifications(false);
  }, [loadNotifications]);

  // Контекст для передачи данных
  const counts = deduplicatedCounts();
  const contextValue: NotificationContextType = {
    // Данные
    notifications: deduplicatedNotifications(),
    hasUnreadNotifications: unreadCount > 0,
    unreadCount,
    unreadCountsByPriority: counts.priorityCounts,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    totalCount: counts.totalCount, // Дедуплицированный счетчик
    originalTotalCount: totalCount, // Исходный счетчик
    
    // Действия
    actions: {
      loadMore,
      refresh,
      markAsRead: handleMarkAsRead,
      deleteNotification: handleDeleteNotification,
      
      // Заглушки для методов которые пока не реализованы
      markAllAsRead: async () => {
        logger.info('TODO: Implement markAllAsRead');
      },
      markAllAsReadByPriority: async (_priority: NotificationPriority) => {
        logger.info('TODO: Implement markAllAsReadByPriority');
      },
      loadMoreByPriority: (_priority: NotificationPriority) => {
        logger.info('TODO: Implement loadMoreByPriority');
      },
      loadMoreIfNeeded: () => {
        logger.info('TODO: Implement loadMoreIfNeeded');
      },
      markAsReadById: handleMarkAsRead,
      markAsReadByType: async (_type: string) => {
        logger.info('TODO: Implement markAsReadByType');
      },
    },
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};