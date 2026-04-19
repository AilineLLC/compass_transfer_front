'use client';

import { createContext, useContext } from 'react';
import type { NotificationPriority } from '';
import type { GetNotificationDTO } from '';

export interface NotificationContextType {
  notifications: GetNotificationDTO[];
  hasUnreadNotifications: boolean; // Простой индикатор для сайдбара
  unreadCount: number; // Точное количество для страницы
  unreadCountsByPriority: Record<NotificationPriority, number>;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  totalCount: number;
  originalTotalCount: number; // Исходное количество до дедупликации
  actions: {
    loadMore: () => void;
    refresh: () => void;
    markAllAsRead: () => Promise<void>;
    markAllAsReadByPriority: (priority: NotificationPriority) => Promise<void>;
    loadMoreByPriority: (priority: NotificationPriority) => void;
    loadMoreIfNeeded: () => void;
    markAsReadById: (id: string) => Promise<void>;
    markAsReadByType: (type: string) => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
  };
}

export const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationProvider');
  }

  return context;
}; 