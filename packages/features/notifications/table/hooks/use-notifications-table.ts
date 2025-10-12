'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { notificationsApi, type NotificationFilters, type GetNotificationDTO, type OrderType } from '@shared/api/notifications';
import { useSavedFilters } from '@shared/hooks';
import type { NotificationType } from '@entities/notifications';

interface NotificationsColumnVisibility {
  type: boolean;
  content: boolean;
  orderType: boolean;
  isRead: boolean;
  actions: boolean;
  title: boolean;
  orderId: boolean;
  rideId: boolean;
  createdAt: boolean;
}

interface SavedNotificationFilters {
  contentFilter: string;
  typeFilter: NotificationType[];
  orderTypeFilter: OrderType[];
  userIdFilter: string;
}

export function useNotificationsTable(initialFilters?: {
  type?: string;
  isRead?: string;
  orderType?: string;
  userId?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Данные
  const [notifications, setNotifications] = useState<GetNotificationDTO[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<GetNotificationDTO[]>([]);
  const [paginatedNotifications, setPaginatedNotifications] = useState<GetNotificationDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMyNotifications, setShowMyNotifications] = useState(false);

  // Фильтры
  const [searchTerm, setSearchTerm] = useState('');
  const [contentFilter, setContentFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<NotificationType[]>(() => {
    const typeParam = searchParams.get('type') || initialFilters?.type;

    return typeParam ? [typeParam as NotificationType] : [];
  });
  const [orderTypeFilter, setOrderTypeFilter] = useState<OrderType[]>(() => {
    const orderTypeParam = searchParams.get('orderType') || initialFilters?.orderType;

    return orderTypeParam ? [orderTypeParam as OrderType] : [];
  });
  const [isReadFilter, setIsReadFilter] = useState<boolean | null>(() => {
    const isReadParam = searchParams.get('isRead') || initialFilters?.isRead;

    if (isReadParam === 'true') return true;
    if (isReadParam === 'false') return false;

    return null;
  });
  const [userIdFilter, setUserIdFilter] = useState(() => {
    return searchParams.get('userId') || initialFilters?.userId || '';
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Пагинация (cursor-based с историей)
  const [currentCursor, setCurrentCursor] = useState<string | null>(null);
  const [isFirstPage, setIsFirstPage] = useState(true);
  const [currentPageNumber, setCurrentPageNumber] = useState(1); // Отслеживаем номер страницы
  const [cursorsHistory, setCursorsHistory] = useState<(string | null)[]>([]);
  const [pageSize, setPageSize] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('notifications-page-size');

      return saved ? parseInt(saved, 10) : 10;
    }

    return 10;
  });
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  // Сортировка
  const [sortBy, setSortBy] = useState<string>('Id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Видимость колонок
  const [columnVisibility, setColumnVisibility] = useState<NotificationsColumnVisibility>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('notifications-column-visibility');

      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // Если не удалось распарсить, используем значения по умолчанию
        }
      }
    }

    return {
      type: true,
      title: true,
      content: false,
      orderType: true,
      orderId: true,
      rideId: false,
      isRead: true,
      createdAt: false,
      actions: true,
    };
  });

  // Конфигурация для сохранения фильтров
  const defaultFilters: SavedNotificationFilters = {
    contentFilter: '',
    typeFilter: [],
    orderTypeFilter: [],
    userIdFilter: '',
  };

  const currentFilters: SavedNotificationFilters = useMemo(() => ({
    contentFilter,
    typeFilter,
    orderTypeFilter,
    userIdFilter,
  }), [contentFilter, typeFilter, orderTypeFilter, userIdFilter]);

  // Функция загрузки сохраненных фильтров
  const onFiltersLoad = useCallback((filters: SavedNotificationFilters) => {
    setContentFilter(filters.contentFilter || '');
    setTypeFilter(filters.typeFilter || []);
    setOrderTypeFilter(filters.orderTypeFilter || []);
    setUserIdFilter(filters.userIdFilter || '');
  }, []);

  // Хук для сохранения фильтров
  const { saveFilters, clearSavedFilters, hasSaved, justSaved } = useSavedFilters({
    key: 'notifications-filters',
    defaultFilters: defaultFilters as unknown as Record<string, unknown>,
    currentFilters: currentFilters as unknown as Record<string, unknown>,
    onFiltersLoad: onFiltersLoad as unknown as (filters: Record<string, unknown>) => void,
  });

  // Загрузка данных
  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params: NotificationFilters = {
        first: isFirstPage,
        after: currentCursor || undefined,
        size: pageSize,
        sortBy,
        sortOrder: sortOrder === 'asc' ? 'Asc' : 'Desc',
      };

      // Добавляем фильтры если они заданы
      if (contentFilter) {
        params.content = contentFilter;
        params.contentOp = 'Contains';
      }
      if (typeFilter.length > 0) {
        params.type = typeFilter;
      }
      if (orderTypeFilter.length > 0) {
        params.orderType = orderTypeFilter;
      }
      if (isReadFilter !== null) {
        params.isRead = isReadFilter;
      }
      if (userIdFilter) {
        params.userId = userIdFilter;
      }
      if (searchTerm) {
        params['FTS.Plain'] = searchTerm;
      }

      const response = showMyNotifications
        ? await notificationsApi.getMyNotifications(params)
        : await notificationsApi.getNotifications(params);

      setNotifications(response.data);
      setFilteredNotifications(response.data);
      setPaginatedNotifications(response.data);
      setTotalPages(Math.ceil(response.totalCount / pageSize));
      setTotalCount(response.totalCount);
      setHasNext(response.hasNext);
      setHasPrevious(response.hasPrevious);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  }, [
    currentCursor,
    isFirstPage,
    pageSize,
    sortBy,
    sortOrder,
    contentFilter,
    typeFilter,
    orderTypeFilter,
    isReadFilter,
    userIdFilter,
    searchTerm,
    showMyNotifications,
  ]);

  // Синхронизируем фильтр с URL параметрами
  useEffect(() => {
    const isReadParam = searchParams.get('isRead');
    let newIsReadFilter: boolean | null = null;

    if (isReadParam === 'true') newIsReadFilter = true;
    if (isReadParam === 'false') newIsReadFilter = false;

    if (newIsReadFilter !== isReadFilter) {
      setIsReadFilter(newIsReadFilter);
    }
  }, [searchParams, isReadFilter]);

  // Загружаем данные при изменении зависимостей
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Обработчики
  const handleNextPage = () => {
    if (notifications.length > 0) {
      const lastNotification = notifications[notifications.length - 1];

      // Сохраняем текущий cursor в историю
      setCursorsHistory(prev => [...prev, currentCursor]);
      setCurrentCursor(lastNotification.id);
      setIsFirstPage(false);
      setCurrentPageNumber(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (cursorsHistory.length > 0) {
      // Берем предыдущий cursor из истории
      const newHistory = [...cursorsHistory];
      const prevCursor = newHistory.pop();

      setCursorsHistory(newHistory);
      setCurrentCursor(prevCursor || null);
      setIsFirstPage(prevCursor === null);
      setCurrentPageNumber(prev => prev - 1);
    }
  };

  const handleFirstPage = () => {
    setCursorsHistory([]);
    setCurrentCursor(null);
    setIsFirstPage(true);
    setCurrentPageNumber(1);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    if (typeof window !== 'undefined') {
      localStorage.setItem('notifications-page-size', size.toString());
    }
    setCursorsHistory([]);
    setCurrentCursor(null);
    setIsFirstPage(true);
    setCurrentPageNumber(1);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleColumnVisibilityChange = (column: keyof NotificationsColumnVisibility, visible: boolean) => {
    const newVisibility = {
      ...columnVisibility,
      [column]: visible,
    };
    
    setColumnVisibility(newVisibility);
    if (typeof window !== 'undefined') {
      localStorage.setItem('notifications-column-visibility', JSON.stringify(newVisibility));
    }
  };

  const handleTypeFilterChange = (types: NotificationType[]) => {
    setTypeFilter(types);
    setCursorsHistory([]);
    setCurrentCursor(null);
    setIsFirstPage(true);
    setCurrentPageNumber(1);
  };

  const handleOrderTypeFilterChange = (orderTypes: OrderType[]) => {
    setOrderTypeFilter(orderTypes);
    setCursorsHistory([]);
    setCurrentCursor(null);
    setIsFirstPage(true);
    setCurrentPageNumber(1);
  };

  const toggleMyNotifications = () => {
    setShowMyNotifications(prev => !prev);
    setCursorsHistory([]);
    setCurrentCursor(null);
    setIsFirstPage(true);
    setCurrentPageNumber(1);
  };

  // Функция для обновления URL с параметрами фильтров
  const updateURL = useCallback((newIsReadFilter: boolean | null) => {
    const params = new URLSearchParams(searchParams.toString());

    if (newIsReadFilter === null) {
      params.delete('isRead');
    } else {
      params.set('isRead', newIsReadFilter.toString());
    }

    const newURL = params.toString() ? `/notifications?${params.toString()}` : '/notifications';

    router.push(newURL);
  }, [searchParams, router]);

  // Обертка для setIsReadFilter с обновлением URL
  const handleIsReadFilterChange = useCallback((value: boolean | null) => {
    setIsReadFilter(value);
    updateURL(value);
    setCursorsHistory([]);
    setCurrentCursor(null);
    setIsFirstPage(true);
    setCurrentPageNumber(1);
  }, [updateURL]);

  return {
    // Данные
    notifications,
    filteredNotifications,
    paginatedNotifications,
    loading,
    error,

    // Фильтры
    searchTerm,
    contentFilter,
    typeFilter,
    orderTypeFilter,
    isReadFilter,
    userIdFilter,
    showAdvancedFilters,

    // Пагинация
    currentCursor,
    isFirstPage,
    currentPageNumber,
    pageSize,
    totalPages,
    totalCount,
    hasNext,
    hasPrevious,

    // Сортировка
    sortBy,
    sortOrder,

    // Видимость колонок
    columnVisibility,

    // Сеттеры
    setSearchTerm: (term: string) => {
      setSearchTerm(term);
      setCursorsHistory([]);
      setCurrentCursor(null);
      setIsFirstPage(true);
      setCurrentPageNumber(1);
    },
    setContentFilter: (content: string) => {
      setContentFilter(content);
      setCursorsHistory([]);
      setCurrentCursor(null);
      setIsFirstPage(true);
      setCurrentPageNumber(1);
    },
    setIsReadFilter: handleIsReadFilterChange,
    setUserIdFilter: (userId: string) => {
      setUserIdFilter(userId);
      setCursorsHistory([]);
      setCurrentCursor(null);
      setIsFirstPage(true);
      setCurrentPageNumber(1);
    },
    setShowAdvancedFilters,

    // Обработчики
    handleNextPage,
    handlePrevPage,
    handleFirstPage,
    handlePageSizeChange,
    handleSort,
    handleColumnVisibilityChange,
    handleTypeFilterChange,
    handleOrderTypeFilterChange,
    loadNotifications,
    router,

    // Режим моих уведомлений
    showMyNotifications,
    toggleMyNotifications,

    // Сохранение фильтров
    saveFilters,
    clearSavedFilters,
    hasSavedFilters: hasSaved,
    justSavedFilters: justSaved,
  };
}
