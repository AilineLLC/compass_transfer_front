'use client';

import { createContext, useContext } from 'react';
import type { GetNotificationDTO } from '@shared/api/notifications';

export type NotificationPriority = 'order' | 'completed' | 'important' | 'warning';

export interface NotificationContextType {
  notifications: GetNotificationDTO[];
  hasUnreadNotifications: boolean;
  unreadCount: number;
  unreadCountsByPriority: Record<NotificationPriority, number>;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  totalCount: number;
  originalTotalCount: number;
  actions: {
    loadMore: () => void;
    refresh: () => Promise<void>;
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
