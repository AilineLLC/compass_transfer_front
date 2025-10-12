import { useState, useEffect, useCallback } from 'react';
import {
  paymentsApi,
  type PaymentFilters,
  type GetPaymentDTO,
  type PaymentStatus,
  type PaymentType,
  type PaymentGateway,
} from '@shared/api/payments';

interface ColumnVisibility {
  type: boolean;
  gateway: boolean;
  status: boolean;
  amount: boolean;
  currency: boolean;
  reference: boolean;
  actions: boolean;
}

export function usePaymentsTable() {
  const [payments, setPayments] = useState<GetPaymentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Фильтры
  const [typeFilter, setTypeFilter] = useState<PaymentType[]>([]);
  const [gatewayFilter, setGatewayFilter] = useState<PaymentGateway[]>([]);
  const [statusFilter, setStatusFilter] = useState<PaymentStatus[]>([]);

  // Пагинация
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [currentPageNumber, setCurrentPageNumber] = useState(1);
  const [currentCursor, setCurrentCursor] = useState<string | null>(null);
  const [cursorsHistory, setCursorsHistory] = useState<(string | null)[]>([]);
  const [isFirstPage, setIsFirstPage] = useState(true);

  // Сортировка
  const [sortBy, setSortBy] = useState<string>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Видимость колонок
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
    type: true,
    gateway: true,
    status: true,
    amount: true,
    currency: true,
    reference: true,
    actions: true,
  });

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: PaymentFilters = {
        first: isFirstPage,
        after: currentCursor || undefined,
        size: pageSize,
        sortBy: sortBy,
        sortOrder: sortOrder === 'asc' ? 'Asc' : 'Desc',
      };

      // Добавляем фильтры
      if (typeFilter.length > 0) {
        params['Type.In'] = typeFilter;
      }

      if (gatewayFilter.length > 0) {
        params['Gateway.In'] = gatewayFilter;
      }

      if (statusFilter.length > 0) {
        params['Status.In'] = statusFilter;
      }

      const response = await paymentsApi.getPayments(params);

      setPayments(response.data || []);
      setTotalCount(response.totalCount || 0);
      setHasNext(response.hasNext || false);
      setHasPrevious(response.hasPrevious || false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки платежей');
    } finally {
      setLoading(false);
    }
  }, [
    pageSize,
    sortBy,
    sortOrder,
    typeFilter,
    gatewayFilter,
    statusFilter,
    currentCursor,
    isFirstPage,
  ]);

  // Загружаем данные при изменении фильтров
  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleNextPage = useCallback(() => {
    if (payments.length > 0) {
      const lastPayment = payments[payments.length - 1];

      setCursorsHistory(prev => [...prev, currentCursor]);
      setCurrentCursor(lastPayment.id);
      setIsFirstPage(false);
      setCurrentPageNumber(prev => prev + 1);
    }
  }, [payments, currentCursor]);

  const handlePrevPage = useCallback(() => {
    if (cursorsHistory.length > 0) {
      const newHistory = [...cursorsHistory];
      const prevCursor = newHistory.pop();

      setCursorsHistory(newHistory);
      setCurrentCursor(prevCursor || null);
      setIsFirstPage(prevCursor === null);
      setCurrentPageNumber(prev => prev - 1);
    }
  }, [cursorsHistory]);

  const handleFirstPage = useCallback(() => {
    setCursorsHistory([]);
    setCurrentCursor(null);
    setIsFirstPage(true);
    setCurrentPageNumber(1);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCursorsHistory([]);
    setCurrentCursor(null);
    setIsFirstPage(true);
    setCurrentPageNumber(1);
  }, []);

  const handleColumnVisibilityChange = useCallback((column: keyof ColumnVisibility, visible: boolean) => {
    setColumnVisibility(prev => ({
      ...prev,
      [column]: visible,
    }));
  }, []);

  const handleSortChange = useCallback((column: string, order: 'asc' | 'desc') => {
    setSortBy(column);
    setSortOrder(order);
    setCursorsHistory([]);
    setCurrentCursor(null);
    setIsFirstPage(true);
    setCurrentPageNumber(1);
  }, []);

  const refetch = useCallback(() => {
    fetchPayments();
  }, [fetchPayments]);

  return {
    payments,
    loading,
    error,
    typeFilter,
    gatewayFilter,
    statusFilter,
    pageSize,
    columnVisibility,
    totalCount,
    hasNext,
    hasPrevious,
    currentPageNumber,
    sortBy,
    sortOrder,
    setTypeFilter,
    setGatewayFilter,
    setStatusFilter,
    handleNextPage,
    handlePrevPage,
    handleFirstPage,
    handlePageSizeChange,
    handleColumnVisibilityChange,
    handleSortChange,
    refetch,
  };
}
