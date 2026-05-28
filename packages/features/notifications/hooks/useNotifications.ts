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

const NOTIFICATION_TYPE_TO_CATEGORY: Record<NotificationType, NotificationCategory> = {
  [NotificationType.OrderCreated]: NotificationCategory.ORDER,
  [NotificationType.OrderUpdated]: NotificationCategory.ORDER,
  [NotificationType.OrderCancelled]: NotificationCategory.ORDER,
  [NotificationType.OrderCompleted]: NotificationCategory.ORDER,
  [NotificationType.RideRequest]: NotificationCategory.ORDER,
  [NotificationType.RideAccepted]: NotificationCategory.ORDER,
  [NotificationType.RideStarted]: NotificationCategory.ORDER,
  [NotificationType.RideCompleted]: NotificationCategory.ORDER,
  [NotificationType.RideCancelled]: NotificationCategory.ORDER,
  [NotificationType.RideUpdate]: NotificationCategory.ORDER,
  [NotificationType.CancelRideRequest]: NotificationCategory.ORDER,
  [NotificationType.DriverHeading]: NotificationCategory.ORDER,
  [NotificationType.DriverArrived]: NotificationCategory.ORDER,
  [NotificationType.DriverAssigned]: NotificationCategory.ORDER,
  [NotificationType.DriverCancelled]: NotificationCategory.ORDER,
  [NotificationType.PaymentReceived]: NotificationCategory.WARNING,
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
    addOptimisticNotification: (notification: GetNotificationDTO) => void;
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
const NULL_UUID = '00000000-0000-0000-0000-000000000000';

export function useNotifications(pageSize: number = 20): UseNotificationsResult {
  // WS-only уведомления (не сохранённые в БД, id = null UUID)
  const [wsNotifications, setWsNotifications] = useState<GetNotificationDTO[]>([]);
  // Серверные уведомления
  const [serverNotifications, setServerNotifications] = useState<GetNotificationDTO[]>([]);
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
          setServerNotifications(prev => [...prev, ...newNotifications]);
        } else {
          setServerNotifications(newNotifications);
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
      // WS-only уведомления помечаем только локально
      if (id.startsWith('ws-')) {
        setWsNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, isRead: true } : n),
        );
        return;
      }
      await notificationsApi.markAsRead([id]);
      setServerNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n),
      );
    } catch (err) {
      logger.error('❌ useNotifications.markAsRead ошибка:', err);
      throw err;
    }
  }, []);

  // Оптимистичное добавление уведомления (из WS, до API sync)
  const addOptimisticNotification = useCallback((notification: GetNotificationDTO) => {
    if (notification.id === NULL_UUID || !notification.id) {
      // WS-only: генерируем уникальный временный ID
      const tempId = `ws-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setWsNotifications(prev => [{ ...notification, id: tempId, isRead: false }, ...prev]);
      setTotalCount(prev => prev + 1);
      return;
    }
    setServerNotifications(prev => {
      if (prev.some(n => n.id === notification.id)) return prev;
      return [notification, ...prev];
    });
    setTotalCount(prev => prev + 1);
  }, []);

  // Удалить уведомление
  const deleteNotification = useCallback(async (id: string) => {
    try {
      if (id.startsWith('ws-')) {
        setWsNotifications(prev => prev.filter(n => n.id !== id));
        setTotalCount(prev => Math.max(0, prev - 1));
        return;
      }
      await notificationsApi.deleteNotification(id);
      setServerNotifications(prev => prev.filter(notification => notification.id !== id));

      logger.info('🗑️ useNotifications.deleteNotification успешно:', id);
    } catch (err) {
      logger.error('❌ useNotifications.deleteNotification ошибка:', err);
      throw err;
    }
  }, []);

  // Объединяем WS-only и серверные (WS-only сверху, они новее)
  const notifications = useMemo(
    () => [...wsNotifications, ...serverNotifications],
    [wsNotifications, serverNotifications],
  );

  // Bug fix #7: memoize derived counts — avoid recomputing on every render
  const { unreadCount, categoryCounts, unreadCategoryCounts } = useMemo(() => {
    const cats: Record<NotificationCategory, number> = {
      [NotificationCategory.ORDER]: 0,
      [NotificationCategory.IMPORTANT]: 0,
      [NotificationCategory.WARNING]: 0,
    };
    const unreadCats: Record<NotificationCategory, number> = {
      [NotificationCategory.ORDER]: 0,
      [NotificationCategory.IMPORTANT]: 0,
      [NotificationCategory.WARNING]: 0,
    };
    let unread = 0;

    notifications.forEach(notification => {
      const category = getNotificationCategory(notification.type);

      cats[category]++;
      if (!notification.isRead) {
        unreadCats[category]++;
        unread++;
      }
    });

    return { unreadCount: unread, categoryCounts: cats, unreadCategoryCounts: unreadCats };
  }, [notifications]);


  const actions = useMemo(() => ({
    loadNotifications,
    loadMore,
    refresh,
    markAsRead,
    deleteNotification,
    addOptimisticNotification,
  }), [loadNotifications, loadMore, refresh, markAsRead, deleteNotification, addOptimisticNotification]);

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
