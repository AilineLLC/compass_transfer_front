'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useRef } from 'react';
import { transfersApi, type GetTransferDTO, type TransferFilters } from '@shared/api/transfers';
import { transferReservationsApi } from '@shared/api/transfer-reservations';

interface ColumnVisibility {
  departureTime: boolean;
  startLocation: boolean;
  endLocation: boolean;
  price: boolean;
  reservations: boolean;
  passengers: boolean;
  freeSeats: boolean;
  driver: boolean;
  car: boolean;
  createdAt: boolean;
  actions: boolean;
}

export function useTransfersTable() {
  const router = useRouter();

  const [transfers, setTransfers] = useState<GetTransferDTO[]>([]);
  const [pendingReservationsMap, setPendingReservationsMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Пагинация (offset-based, поскольку API возвращает page/size)
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageNumber, setCurrentPageNumber] = useState(1);
  const [cursorsHistory, setCursorsHistory] = useState<number[]>([]);
  const [pageSize, setPageSize] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('transfers-page-size');
      return saved ? parseInt(saved, 10) : 10;
    }
    return 10;
  });
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  // Сортировка
  const [sortBy, setSortBy] = useState<string>('departureTime');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Видимость колонок
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('transfers-column-visibility');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // используем значения по умолчанию
        }
      }
    }
    return {
      departureTime: true,
      startLocation: true,
      endLocation: true,
      price: true,
      reservations: true,
      passengers: true,
      freeSeats: true,
      driver: true,
      car: true,
      createdAt: true,
      actions: true,
    };
  });

  const loadingRef = useRef(false);

  const loadTransfers = useCallback(async () => {
    if (loadingRef.current) return;

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const params: TransferFilters = {
        page: currentPage,
        size: pageSize,
        sortBy,
        sortOrder: sortOrder === 'asc' ? 'Asc' : 'Desc',
      };

      const [response, reservationsResponse] = await Promise.all([
        transfersApi.getTransfers(params),
        transferReservationsApi.getReservations({ status: 'Pending', size: 1000 }),
      ]);

      setTransfers(response.data);
      setTotalCount(response.totalCount);
      setHasNext(response.hasNext);
      setHasPrevious(response.hasPrevious);

      const map: Record<string, number> = {};
      for (const r of reservationsResponse.data) {
        map[r.transfer] = (map[r.transfer] || 0) + 1;
      }
      setPendingReservationsMap(map);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [currentPage, pageSize, sortBy, sortOrder]);

  useEffect(() => {
    loadTransfers();
  }, [loadTransfers]);

  const handleNextPage = () => {
    setCursorsHistory(prev => [...prev, currentPage]);
    setCurrentPage(prev => prev + 1);
    setCurrentPageNumber(prev => prev + 1);
  };

  const handlePrevPage = () => {
    const newHistory = [...cursorsHistory];
    newHistory.pop();
    setCursorsHistory(newHistory);
    setCurrentPage(prev => Math.max(1, prev - 1));
    setCurrentPageNumber(prev => Math.max(1, prev - 1));
  };

  const handleFirstPage = () => {
    setCursorsHistory([]);
    setCurrentPage(1);
    setCurrentPageNumber(1);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCursorsHistory([]);
    setCurrentPage(1);
    setCurrentPageNumber(1);
    if (typeof window !== 'undefined') {
      localStorage.setItem('transfers-page-size', size.toString());
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    handleFirstPage();
  };

  const handleColumnVisibilityChange = (column: keyof ColumnVisibility, visible: boolean) => {
    const newVisibility = { ...columnVisibility, [column]: visible };
    setColumnVisibility(newVisibility);
    if (typeof window !== 'undefined') {
      localStorage.setItem('transfers-column-visibility', JSON.stringify(newVisibility));
    }
  };

  return {
    transfers,
    pendingReservationsMap,
    loading,
    error,

    pageSize,
    totalCount,
    hasNext,
    hasPrevious,
    currentPageNumber,

    sortBy,
    sortOrder,
    columnVisibility,

    handleNextPage,
    handlePrevPage,
    handleFirstPage,
    handlePageSizeChange,
    handleSort,
    handleColumnVisibilityChange,

    loadTransfers,
    refetch: loadTransfers,
    router,
  };
}
