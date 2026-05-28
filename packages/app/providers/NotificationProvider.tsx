'use client';

import { useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { useSignalR } from '@shared/hooks/signal/useSignalR';
import { logger } from '@shared/lib/logger';
import { NotificationContext, type NotificationContextType } from '@entities/notifications/context';
import { deduplicateNotificationsByOrder } from '@entities/notifications/utils';
import { useNotifications, useNotificationSound } from '@features/notifications/hooks';

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
  const { playSound } = useNotificationSound({ loop: false });

  const {
    notifications,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    totalCount,
    actions: {
      loadNotifications,
      loadMore,
      refresh,
      markAsRead,
      deleteNotification,
      addOptimisticNotification,
    }
  } = useNotifications(20);


  // Bug fix #6: useMemo instead of useCallback — compute once, not on every call
  const deduplicatedNotifications = useMemo(
    () => deduplicateNotificationsByOrder(notifications),
    [notifications],
  );

  const deduplicatedCounts = useMemo(() => {
    const priorityCounts: Record<NotificationPriority, number> = {
      order: 0,
      completed: 0,
      important: 0,
      warning: 0,
    };
    let totalUnread = 0;

    deduplicatedNotifications.forEach(notification => {
      if (!notification.isRead) {
        const priority = getNotificationPriority(notification.type);

        priorityCounts[priority]++;
        totalUnread++;
      }
    });

    return {
      priorityCounts,
      totalUnread,
      totalCount: deduplicatedNotifications.length,
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

  // Stable stubs for not-yet-implemented actions
  const markAllAsRead = useCallback(async () => {
    logger.info('TODO: Implement markAllAsRead');
  }, []);

  const markAllAsReadByPriority = useCallback(async (_priority: NotificationPriority) => {
    logger.info('TODO: Implement markAllAsReadByPriority');
  }, []);

  const loadMoreByPriority = useCallback((_priority: NotificationPriority) => {
    logger.info('TODO: Implement loadMoreByPriority');
  }, []);

  const loadMoreIfNeeded = useCallback(() => {
    logger.info('TODO: Implement loadMoreIfNeeded');
  }, []);

  const markAsReadByType = useCallback(async (_type: string) => {
    logger.info('TODO: Implement markAsReadByType');
  }, []);

  // Bug fix #5: destructure stable refs instead of depending on the whole signalR object
  // (signalR object is recreated on every render, causing this effect to re-run unnecessarily)
  const { connection, isConnected, on, off } = signalR;

  useEffect(() => {
    if (!connection || !isConnected) return;

    const pendingTimers: ReturnType<typeof setTimeout>[] = [];

    const handleNewNotification = (data: unknown) => {
      logger.info('📨 NotificationProvider: получено новое уведомление через SignalR', data);
      playSound();

      if (data && typeof data === 'object' && 'id' in data) {
        const wsNotif = data as import('@shared/api/notifications').GetNotificationDTO;
        const isWsOnly = !wsNotif.id || wsNotif.id === '00000000-0000-0000-0000-000000000000';

        addOptimisticNotification({ ...wsNotif, isRead: false });

        if (!isWsOnly) {
          const timer = setTimeout(() => { refresh(); }, 1500);
          pendingTimers.push(timer);
        }
      }
    };

    on('New', handleNewNotification);

    return () => {
      off('New', handleNewNotification);
      pendingTimers.forEach(t => clearTimeout(t));
    };
  }, [connection, isConnected, on, off, refresh, addOptimisticNotification, playSound]);

  // Автоматическая загрузка при монтировании
  useEffect(() => {
    loadNotifications(false);
  }, [loadNotifications]);

  // Bug fix #10: memoize context value — consumers only re-render when data actually changes
  const contextValue = useMemo<NotificationContextType>(() => ({
    notifications: deduplicatedNotifications,
    hasUnreadNotifications: deduplicatedCounts.totalUnread > 0,
    unreadCount: deduplicatedCounts.totalUnread,
    unreadCountsByPriority: deduplicatedCounts.priorityCounts,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    totalCount: deduplicatedCounts.totalCount,
    originalTotalCount: totalCount,
    actions: {
      loadMore,
      refresh,
      markAsRead: handleMarkAsRead,
      deleteNotification: handleDeleteNotification,
      markAllAsRead,
      markAllAsReadByPriority,
      loadMoreByPriority,
      loadMoreIfNeeded,
      markAsReadById: handleMarkAsRead,
      markAsReadByType,
    },
  }), [
    deduplicatedNotifications,
    deduplicatedCounts,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    totalCount,
    loadMore,
    refresh,
    handleMarkAsRead,
    handleDeleteNotification,
    markAllAsRead,
    markAllAsReadByPriority,
    loadMoreByPriority,
    loadMoreIfNeeded,
    markAsReadByType,
  ]);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};