'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { DataTablePagination, DataTableErrorState } from '@shared/ui/data-table';
import { paymentsApi, type GetPaymentDTO, type PaymentFilters } from '@shared/api/payments';
import { PaymentsTableContent } from './components/payments-table-content';

export function MyPaymentsTable() {
  const router = useRouter();
  const [payments, setPayments] = useState<GetPaymentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Пагинация
  const [pageSize, setPageSize] = useState(10);
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
  const columnVisibility = {
    type: true,
    gateway: true,
    status: true,
    orderId: true,
    userId: false,
    amount: true,
    currency: true,
    reference: false,
    actions: true,
  };

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

      const response = await paymentsApi.getMyPayments(params);

      setPayments(response.data || []);
      setTotalCount(response.totalCount || 0);
      setHasNext(response.hasNext || false);
      setHasPrevious(response.hasPrevious || false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки платежей');
    } finally {
      setLoading(false);
    }
  }, [pageSize, sortBy, sortOrder, currentCursor, isFirstPage]);

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

  const handleSortChange = useCallback((column: string, order: 'asc' | 'desc') => {
    setSortBy(column);
    setSortOrder(order);
    setCursorsHistory([]);
    setCurrentCursor(null);
    setIsFirstPage(true);
    setCurrentPageNumber(1);
  }, []);

  const handleViewDetails = (paymentId: string) => {
    router.push(`/payments/${paymentId}`);
  };

  if (error) {
    return <DataTableErrorState error={error} onRetry={fetchPayments} entityName="платежей" />;
  }

  return (
    <div className="space-y-4">
      {/* Таблица */}
      <PaymentsTableContent
        payments={payments}
        loading={loading}
        columnVisibility={columnVisibility}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        onViewDetails={handleViewDetails}
      />

      {/* Пагинация */}
      <DataTablePagination
        currentItems={payments}
        totalCount={totalCount}
        pageSize={pageSize}
        hasNext={hasNext}
        hasPrevious={hasPrevious}
        currentPageNumber={currentPageNumber}
        handleNextPage={handleNextPage}
        handlePrevPage={handlePrevPage}
        handleFirstPage={handleFirstPage}
        itemName="платежей"
      />
    </div>
  );
}
