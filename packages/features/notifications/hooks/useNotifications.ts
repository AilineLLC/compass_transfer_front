'use client'

import { useState, useCallback, useRef, useMemo } from 'react';
import { notificationsApi, type GetNotificationDTO, type NotificationApiResponse } from '@shared/api/notifications';
import { logger } from '@shared/lib/logger';
import { NotificationType } from '@entities/notifications';

// Категории уведомлений для табов
export enum NotificationCategory {
  ORDER = 'ORDER',
  IMPORTANT = 'IMPORTANT', 
  WARNING = 'WARNING'
}

// Маппинг типов уведомлений к категориям
const NOTIFICATION_TYPE_TO_CATEGORY: Record<NotificationType, NotificationCategory> = {
  [NotificationType.OrderCreated]: NotificationCategory.ORDER,
  [NotificationType.OrderConfirmed]: NotificationCategory.ORDER,
  [NotificationType.OrderCancelled]: NotificationCategory.ORDER,
  [NotificationType.OrderCompleted]: NotificationCategory.ORDER,

  [NotificationType.RideRequest]: NotificationCategory.ORDER,
  [NotificationType.RideAccepted]: NotificationCategory.ORDER,
  [NotificationType.RideRejected]: NotificationCategory.ORDER,
  [NotificationType.RideStarted]: NotificationCategory.ORDER,
  [NotificationType.RideCompleted]: NotificationCategory.ORDER,
  [NotificationType.RideCancelled]: NotificationCategory.ORDER,

  [NotificationType.DriverHeading]: NotificationCategory.ORDER,
  [NotificationType.DriverArrived]: NotificationCategory.ORDER,
  [NotificationType.DriverCancelled]: NotificationCategory.ORDER,

  [NotificationType.Payment]: NotificationCategory.WARNING,
  [NotificationType.PaymentReceived]: NotificationCategory.WARNING,
  [NotificationType.PaymentFailed]: NotificationCategory.WARNING,
};

export interface UseNotificationsResult {
  notifications: GetNotificationDTO[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  totalCount: number;
  unreadCount: number;
  // Счетчики по категориям
  categoryCounts: Record<NotificationCategory, number>;
  unreadCategoryCounts: Record<NotificationCategory, number>;
  actions: {
    loadNotifications: (append?: boolean, category?: NotificationCategory) => Promise<void>;
    loadMore: () => Promise<void>;
    refresh: (category?: NotificationCategory) => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
  };
}

// Функция для получения типов уведомлений по категории
const getNotificationTypesByCategory = (category: NotificationCategory): NotificationType[] => {
  return Object.entries(NOTIFICATION_TYPE_TO_CATEGORY)
    .filter(([, cat]) => cat === category)
    .map(([type]) => type as NotificationType);
};

// Функция для определения категории уведомления
export const getNotificationCategory = (type: NotificationType): NotificationCategory => {
  return NOTIFICATION_TYPE_TO_CATEGORY[type] || NotificationCategory.WARNING;
};

/**
 * Хук для работы с уведомлениями
 * Использует notification-service для API вызовов
 */
export function useNotifications(pageSize: number = 20): UseNotificationsResult {
  // Состояние
  const [notifications, setNotifications] = useState<GetNotificationDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [_currentCategory, setCurrentCategory] = useState<NotificationCategory | undefined>(undefined);

  // Курсор для пагинации
  const lastCursorRef = useRef<string | undefined>(undefined);

  // Загрузка уведомлений
  const loadNotifications = useCallback(
    async (append: boolean = false, category?: NotificationCategory) => {
      try {
        if (append) {
          setIsLoadingMore(true);
        } else {
          setIsLoading(true);
          lastCursorRef.current = undefined; // Сбрасываем курсор для новой загрузки
          setCurrentCategory(category);
        }
        setError(null);

        // Подготавливаем параметры для API
        const apiParams: Record<string, unknown> = {
          size: pageSize,
          after: append ? lastCursorRef.current : undefined,
        };

        // Добавляем фильтр по типам если указана категория
        if (category) {
          apiParams.type = getNotificationTypesByCategory(category);
        }

        // Используем cursor-based пагинацию
        const result: NotificationApiResponse = await notificationsApi.getMyNotifications(apiParams);

        const newNotifications = result.data || [];

        if (append) {
          setNotifications(prev => [...prev, ...newNotifications]);
        } else {
          setNotifications(newNotifications);
        }

        setTotalCount(result.totalCount || 0);
        setHasMore(result.hasNext || false);

        // Обновляем курсор
        if (newNotifications.length > 0) {
          const newCursor = newNotifications[newNotifications.length - 1].id;

          lastCursorRef.current = newCursor;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Ошибка загрузки уведомлений';

        logger.error('❌ useNotifications ошибка:', err);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [pageSize],
  );

  // Загрузка следующей страницы
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || isLoading) {

      return;
    }

    await loadNotifications(true);
  }, [hasMore, isLoadingMore, isLoading, loadNotifications]);

  // Обновление списка
  const refresh = useCallback(async (category?: NotificationCategory) => {
    await loadNotifications(false, category);
  }, [loadNotifications]);

  // Отметить как прочитанное
  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationsApi.markAsRead([id]);

      // Обновляем локальное состояние
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === id ? { ...notification, isRead: true } : notification,
        ),
      );

    } catch (err) {
      logger.error('❌ useNotifications.markAsRead ошибка:', err);
      throw err;
    }
  }, []);

  // Удалить уведомление
  const deleteNotification = useCallback(async (id: string) => {
    try {
      await notificationsApi.deleteNotification(id);

      // Обновляем локальное состояние
      setNotifications(prev => prev.filter(notification => notification.id !== id));

      logger.info('🗑️ useNotifications.deleteNotification успешно:', id);
    } catch (err) {
      logger.error('❌ useNotifications.deleteNotification ошибка:', err);
      throw err;
    }
  }, []);

  // Подсчет непрочитанных
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Подсчет по категориям (для всех уведомлений, не только текущих)
  const categoryCounts: Record<NotificationCategory, number> = {
    [NotificationCategory.ORDER]: 0,
    [NotificationCategory.IMPORTANT]: 0,
    [NotificationCategory.WARNING]: 0,
  };

  const unreadCategoryCounts: Record<NotificationCategory, number> = {
    [NotificationCategory.ORDER]: 0,
    [NotificationCategory.IMPORTANT]: 0,
    [NotificationCategory.WARNING]: 0,
  };

  // Подсчитываем только для текущих загруженных уведомлений
  notifications.forEach(notification => {
    const category = getNotificationCategory(notification.type);

    categoryCounts[category]++;
    if (!notification.isRead) {
      unreadCategoryCounts[category]++;
    }
  });


  const actions = useMemo(() => ({
    loadNotifications,
    loadMore,
    refresh,
    markAsRead,
    deleteNotification,
  }), [loadNotifications, loadMore, refresh, markAsRead, deleteNotification]);

  return {
    notifications,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    totalCount,
    unreadCount,
    categoryCounts,
    unreadCategoryCounts,
    actions,
  };
}
