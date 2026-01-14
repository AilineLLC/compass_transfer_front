'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ordersApi, type OrderFilters, type GetOrderDTO } from '@shared/api/orders';
import { useUserRole } from '@shared/contexts/user-role-context';
import { useSavedFilters } from '@shared/hooks';
import { useSignalR } from '@shared/hooks/signal/useSignalR';
import type { OrderStatus } from '@entities/orders/enums/OrderStatus.enum';
import type { OrderSubStatus } from '@entities/orders/enums/OrderSubStatus.enum';
import type { OrderType } from '@entities/orders/enums/OrderType.enum';
import { Role } from '@entities/users/enums';

interface ColumnVisibility {
  orderNumber: boolean;
  type: boolean;
  status: boolean;
  subStatus: boolean;
  initialPrice: boolean;
  finalPrice: boolean;
  createdAt: boolean;
  completedAt: boolean;
  scheduledTime: boolean;
  airFlight: boolean;
  flyReis: boolean;
  actions: boolean;
}

interface SavedOrderFilters extends Record<string, unknown> {
  orderNumberFilter: string;
  typeFilter: OrderType[];
  statusFilter: OrderStatus[];
  subStatusFilter: OrderSubStatus[];
  airFlightFilter: string;
  flyReisFilter: string;
}

export function useOrdersTable(initialFilters?: {
  orderNumber?: string;
  type?: string;
  status?: string;
  subStatus?: string;
  airFlight?: string;
  flyReis?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userRole } = useUserRole();
  const signalR = useSignalR();
  
  // Данные
  const [orders, setOrders] = useState<GetOrderDTO[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<GetOrderDTO[]>([]);
  const [paginatedOrders, setPaginatedOrders] = useState<GetOrderDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Фильтры
  const [searchTerm, setSearchTerm] = useState('');
  const [orderNumberFilter, setOrderNumberFilter] = useState(initialFilters?.orderNumber || '');
  const [typeFilter, setTypeFilter] = useState<OrderType[]>(
    initialFilters?.type ? [initialFilters.type as OrderType] : []
  );
  const [statusFilter, setStatusFilter] = useState<OrderStatus[]>(
    initialFilters?.status ? [initialFilters.status as OrderStatus] : []
  );
  const [subStatusFilter, setSubStatusFilter] = useState<OrderSubStatus[]>(
    initialFilters?.subStatus ? [initialFilters.subStatus as OrderSubStatus] : []
  );
  // Локальные состояния для ввода (без debounce)
  const [airFlightInput, setAirFlightInput] = useState(initialFilters?.airFlight || '');
  const [flyReisInput, setFlyReisInput] = useState(initialFilters?.flyReis || '');
  // Фактические фильтры для API (с debounce)
  const [airFlightFilter, setAirFlightFilter] = useState(initialFilters?.airFlight || '');
  const [flyReisFilter, setFlyReisFilter] = useState(initialFilters?.flyReis || '');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Пагинация (cursor-based с историей)
  const [currentCursor, setCurrentCursor] = useState<string | null>(null);
  const [isFirstPage, setIsFirstPage] = useState(true);
  const [currentPageNumber, setCurrentPageNumber] = useState(1);
  const [cursorsHistory, setCursorsHistory] = useState<(string | null)[]>([]);
  const [pageSize, setPageSize] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('orders-page-size');

      return saved ? parseInt(saved, 10) : 10;
    }

    return 10;
  });
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  // Сортировка
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Видимость колонок
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('orders-column-visibility');
      
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // Если не удалось распарсить, используем значения по умолчанию
        }
      }
    }

    return {
      orderNumber: true,
      type: true,
      status: true,
      subStatus: true,
      initialPrice: true,
      finalPrice: true,
      createdAt: true,
      completedAt: true,
      scheduledTime: true,
      airFlight: false,
      flyReis: false,
      actions: true,
    };
  });

  // Защита от двойных вызовов
  const loadingRef = useRef(false);

  // Отслеживаем изменения URL параметров и обновляем фильтры
  useEffect(() => {
    const currentStatus = searchParams.get('status');
    const currentType = searchParams.get('type');
    const currentOrderNumber = searchParams.get('orderNumber');

    // Обновляем фильтры только если они изменились
    let filtersChanged = false;

    // Если в URL есть статус, обновляем фильтр (для поддержки прямых ссылок)
    if (currentStatus) {
      const statusArray = [currentStatus as OrderStatus];
      // Проверяем, изменился ли фильтр (сравниваем массивы)
      if (statusArray.length !== statusFilter.length || 
          !statusArray.every(status => statusFilter.includes(status))) {
        setStatusFilter(statusArray);
        filtersChanged = true;
      }
    }
    // Не сбрасываем statusFilter если нет currentStatus - пользователь мог выбрать через UI

    if (currentType && currentType !== typeFilter[0]) {
      setTypeFilter([currentType as OrderType]);
      filtersChanged = true;
    }
    // Не сбрасываем typeFilter если нет currentType - пользователь мог выбрать через UI

    if (currentOrderNumber !== orderNumberFilter) {
      setOrderNumberFilter(currentOrderNumber || '');
      filtersChanged = true;
    }

    // Фильтры рейсов (airFlight и flyReis) не синхронизируются с URL
    // Они работают только локально с debounce

    // Сбрасываем пагинацию при изменении фильтров
    if (filtersChanged) {
      setCursorsHistory([]);
      setCurrentCursor(null);
      setIsFirstPage(true);
      setCurrentPageNumber(1);
    }
  }, [searchParams, statusFilter, typeFilter, orderNumberFilter]);

  // Загрузка данных
  const loadOrders = useCallback(async () => {
    if (loadingRef.current) {
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      const params: OrderFilters = {
        first: isFirstPage,
        after: currentCursor || undefined,
        size: pageSize,
        sortBy,
        sortOrder: sortOrder === 'asc' ? 'Asc' : 'Desc',
      };

      // Добавляем фильтры если они заданы
      if (orderNumberFilter) {
        params.orderNumber = orderNumberFilter;
        params.orderNumberOp = 'Equal';
      }
      if (typeFilter.length > 0) {
        params.type = typeFilter;
      }
      if (statusFilter.length > 0) {
        params.status = statusFilter;
      }
      if (subStatusFilter.length > 0) {
        params.subStatus = subStatusFilter;
      }
      if (airFlightFilter) {
        params.airFlight = airFlightFilter;
        params.airFlightOp = 'Contains';
      }
      if (flyReisFilter) {
        params.flyReis = flyReisFilter;
        params.flyReisOp = 'Contains';
      }
      if (searchTerm) {
        params.orderNumber = searchTerm;
        params.orderNumberOp = 'Equal';
      }

      // Для партнеров используем API для заказов созданных ими
      const response = userRole === Role.Partner
        ? await ordersApi.getMyCreatorOrders(params)
        : await ordersApi.getOrders(params);

      setOrders(response.data);
      setFilteredOrders(response.data);
      setPaginatedOrders(response.data);
      setTotalCount(response.totalCount);
      setHasNext(response.hasNext);
      setHasPrevious(response.hasPrevious);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [
    currentCursor,
    isFirstPage,
    pageSize,
    sortBy,
    sortOrder,
    orderNumberFilter,
    typeFilter,
    statusFilter,
    subStatusFilter,
    airFlightFilter,
    flyReisFilter,
    searchTerm,
    userRole,
  ]);

  // Загружаем данные при изменении зависимостей
  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Debounce для фильтров рейсов (применяем через 500мс после последнего ввода)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (airFlightInput !== airFlightFilter) {
        setAirFlightFilter(airFlightInput);
        setCursorsHistory([]);
        setCurrentCursor(null);
        setIsFirstPage(true);
        setCurrentPageNumber(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [airFlightInput, airFlightFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (flyReisInput !== flyReisFilter) {
        setFlyReisFilter(flyReisInput);
        setCursorsHistory([]);
        setCurrentCursor(null);
        setIsFirstPage(true);
        setCurrentPageNumber(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [flyReisInput, flyReisFilter]);

  // Подписка на SignalR события для автоматического обновления списка заказов
  useEffect(() => {
    if (!signalR.isConnected) return;

    // События, которые влияют на список заказов
    const orderEvents = [
      'OrderCreatedNotification',
      'OrderConfirmedNotification',
      'OrderCompletedNotification',
      'OrderCancelledNotification',
      'OrderUpdatedNotification',
      'RideRequestNotification',
      'RideAcceptedNotification',
      'RideStartedNotification',
      'RideCompletedNotification',
      'RideCancelledNotification',
      'DriverAssignedNotification',
    ];

    // Обработчик события - перезагружаем список заказов
    const handleOrderEvent = () => {
      loadOrders();
    };

    // Подписываемся на все события
    orderEvents.forEach(event => {
      signalR.on(event, handleOrderEvent);
    });

    // Отписываемся при размонтировании
    return () => {
      orderEvents.forEach(event => {
        signalR.off(event, handleOrderEvent);
      });
    };
  }, [signalR, loadOrders]);

  // Конфигурация для сохранения фильтров
  const defaultFilters: SavedOrderFilters = useMemo(() => ({
    orderNumberFilter: '',
    typeFilter: [],
    statusFilter: [],
    subStatusFilter: [],
    airFlightFilter: '',
    flyReisFilter: '',
  }), []);

  const currentFilters: SavedOrderFilters = useMemo(() => ({
    orderNumberFilter,
    typeFilter,
    statusFilter,
    subStatusFilter,
    airFlightFilter,
    flyReisFilter,
  }), [orderNumberFilter, typeFilter, statusFilter, subStatusFilter, airFlightFilter, flyReisFilter]);

  // Функция загрузки сохраненных фильтров
  const onFiltersLoad = useCallback((filters: SavedOrderFilters) => {
    setOrderNumberFilter(filters.orderNumberFilter || '');
    setTypeFilter(filters.typeFilter || []);
    setStatusFilter(filters.statusFilter || []);
    setSubStatusFilter(filters.subStatusFilter || []);
    setAirFlightInput(filters.airFlightFilter || '');
    setAirFlightFilter(filters.airFlightFilter || '');
    setFlyReisInput(filters.flyReisFilter || '');
    setFlyReisFilter(filters.flyReisFilter || '');
  }, []);

  // Хук для сохранения фильтров
  const { saveFilters, clearSavedFilters, hasSaved, justSaved } = useSavedFilters({
    key: 'orders-filters',
    defaultFilters,
    currentFilters,
    onFiltersLoad,
  });

  // Обработчики
  const handleNextPage = () => {
    if (orders.length > 0) {
      const lastOrder = orders[orders.length - 1];

      // Сохраняем текущий cursor в историю
      setCursorsHistory(prev => [...prev, currentCursor]);
      setCurrentCursor(lastOrder.id);
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
    setCursorsHistory([]);
    setCurrentCursor(null);
    setIsFirstPage(true);
    setCurrentPageNumber(1);

    if (typeof window !== 'undefined') {
      localStorage.setItem('orders-page-size', size.toString());
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleColumnVisibilityChange = (column: keyof ColumnVisibility, visible: boolean) => {
    const newVisibility = {
      ...columnVisibility,
      [column]: visible,
    };

    setColumnVisibility(newVisibility);
    if (typeof window !== 'undefined') {
      localStorage.setItem('orders-column-visibility', JSON.stringify(newVisibility));
    }
  };

  const handleTypeFilterChange = (types: OrderType[]) => {
    setTypeFilter(types);
    setCursorsHistory([]);
    setCurrentCursor(null);
    setIsFirstPage(true);
    setCurrentPageNumber(1);
  };

  const handleStatusFilterChange = (statuses: OrderStatus[]) => {
    setStatusFilter(statuses);
    setCursorsHistory([]);
    setCurrentCursor(null);
    setIsFirstPage(true);
    setCurrentPageNumber(1);
  };

  const handleSubStatusFilterChange = (subStatuses: OrderSubStatus[]) => {
    setSubStatusFilter(subStatuses);
    setCursorsHistory([]);
    setCurrentCursor(null);
    setIsFirstPage(true);
    setCurrentPageNumber(1);
  };

  return {
    // Данные
    orders,
    filteredOrders,
    paginatedOrders,
    loading,
    error,

    // Фильтры
    searchTerm,
    orderNumberFilter,
    typeFilter,
    statusFilter,
    subStatusFilter,
    airFlightInput,
    airFlightFilter,
    flyReisInput,
    flyReisFilter,
    showAdvancedFilters,

    // Пагинация
    currentCursor,
    isFirstPage,
    pageSize,
    totalCount,
    hasNext,
    hasPrevious,
    currentPageNumber,

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
    setOrderNumberFilter: (orderNumber: string) => {
      setOrderNumberFilter(orderNumber);
      setCursorsHistory([]);
      setCurrentCursor(null);
      setIsFirstPage(true);
      setCurrentPageNumber(1);
    },
    setAirFlightInput: (airFlight: string) => {
      setAirFlightInput(airFlight);
      // Debounce будет применен через useEffect
    },
    setFlyReisInput: (flyReis: string) => {
      // Валидация: только заглавные буквы, цифры, пробелы и дефисы
      const sanitized = flyReis.toUpperCase().replace(/[^A-Z0-9\s-]/g, '');
      setFlyReisInput(sanitized);
      // Debounce будет применен через useEffect
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
    handleStatusFilterChange,
    handleSubStatusFilterChange,
    loadOrders,
    router,

    // Сохранение фильтров
    saveFilters,
    clearSavedFilters,
    hasSavedFilters: hasSaved,
    justSavedFilters: justSaved,

    // Обновление данных
    refetch: loadOrders,
  };
}
