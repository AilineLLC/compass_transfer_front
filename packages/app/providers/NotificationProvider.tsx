'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { useSignalR } from '@shared/hooks/signal/useSignalR';
import { logger } from '@shared/lib/logger';
import { NotificationContext, type NotificationContextType, type NotificationPriority } from '@entities/notifications/context';
import { deduplicateNotificationsByOrder } from '@entities/notifications/utils';
import { useNotifications } from '@features/notifications/hooks';

interface NotificationProviderProps {
  children: ReactNode;
}

const getNotificationPriority = (type: string): NotificationPriority => {
  switch (type) {
    case 'OrderCreated':
    case 'OrderConfirmed':
      return 'order';
    case 'OrderCompleted':
    case 'RideCompleted':
      return 'completed';
    case 'PaymentFailed':
    case 'DriverCancelled':
    case 'RideCancelled':
      return 'important';
    default:
      return 'warning';
  }
};

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const signalR = useSignalR();

  const {
    notifications,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    totalCount,
    unreadCount,
    actions: { loadNotifications, loadMore, refresh, markAsRead, deleteNotification },
  } = useNotifications(20);

  const [realTimeUnreadCount, setRealTimeUnreadCount] = useState(0);

  const deduplicatedNotifications = useCallback(
    () => deduplicateNotificationsByOrder(notifications),
    [notifications],
  );

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

    return { priorityCounts, totalUnread, totalCount: deduplicated.length };
  }, [deduplicatedNotifications]);

  const handleMarkAsRead = useCallback(async (id: string) => {
    try {
      await markAsRead(id);
      setRealTimeUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      logger.error('NotificationProvider.markAsRead error:', err);
    }
  }, [markAsRead]);

  const handleDeleteNotification = useCallback(async (id: string) => {
    try {
      const wasUnread = notifications.find(n => n.id === id && !n.isRead);
      await deleteNotification(id);
      if (wasUnread) setRealTimeUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      logger.error('NotificationProvider.deleteNotification error:', err);
    }
  }, [deleteNotification, notifications]);

  // Подписка на единственный WS-эвент New
  useEffect(() => {
    if (!signalR.isConnected) return;

    const handleNew = () => {
      logger.info('📨 NotificationProvider: новое уведомление через SignalR');
      setRealTimeUnreadCount(prev => prev + 1);
      refresh();
    };

    signalR.on('New', handleNew);
    return () => signalR.off('New', handleNew);
  }, [signalR.isConnected, signalR.on, signalR.off, refresh]);

  // Начальная загрузка
  useEffect(() => {
    loadNotifications(false);
  }, [loadNotifications]);

  const counts = deduplicatedCounts();
  const contextValue: NotificationContextType = {
    notifications: deduplicatedNotifications(),
    hasUnreadNotifications: (unreadCount + realTimeUnreadCount) > 0,
    unreadCount: unreadCount + realTimeUnreadCount,
    unreadCountsByPriority: counts.priorityCounts,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    totalCount: counts.totalCount,
    originalTotalCount: totalCount,
    actions: {
      loadMore,
      refresh,
      markAsRead: handleMarkAsRead,
      deleteNotification: handleDeleteNotification,
      markAllAsRead: async () => { logger.info('TODO: markAllAsRead'); },
      markAllAsReadByPriority: async () => { logger.info('TODO: markAllAsReadByPriority'); },
      loadMoreByPriority: () => { logger.info('TODO: loadMoreByPriority'); },
      loadMoreIfNeeded: () => { logger.info('TODO: loadMoreIfNeeded'); },
      markAsReadById: handleMarkAsRead,
      markAsReadByType: async () => { logger.info('TODO: markAsReadByType'); },
    },
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};
