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

  const paginationModeRef = useRef<'first' | 'after' | 'before'>('first');
  const afterCursorRef = useRef<string | null>(null);
  const beforeCursorRef = useRef<string | null>(null);
  const [loadTrigger, setLoadTrigger] = useState(0);
  const [currentPageNumber, setCurrentPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('transfers-page-size');
      return saved ? parseInt(saved, 10) : 10;
    }
    return 10;
  });
  const [totalCount, setTotalCount] = useState(0);

  const [sortBy, setSortBy] = useState<string>('departureTime');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

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
        size: pageSize,
        sortBy,
        sortOrder: sortOrder === 'asc' ? 'Asc' : 'Desc',
      };

      if (paginationModeRef.current === 'after' && afterCursorRef.current) {
        params.after = afterCursorRef.current;
      } else if (paginationModeRef.current === 'before' && beforeCursorRef.current) {
        params.before = beforeCursorRef.current;
      } else {
        params.first = true;
      }

      const [response, reservationsResponse] = await Promise.all([
        transfersApi.getTransfers(params),
        transferReservationsApi.getReservations({ status: 'Pending', size: 1000 }),
      ]);

      setTransfers(response.data);
      setTotalCount(response.totalCount);

      if (response.data.length > 0) {
        afterCursorRef.current = response.data[response.data.length - 1].id;
        beforeCursorRef.current = response.data[0].id;
      }

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
  }, [loadTrigger, pageSize, sortBy, sortOrder]);

  useEffect(() => {
    loadTransfers();
  }, [loadTransfers]);

  const handleNextPage = () => {
    paginationModeRef.current = 'after';
    setCurrentPageNumber(prev => prev + 1);
    setLoadTrigger(prev => prev + 1);
  };

  const handlePrevPage = () => {
    paginationModeRef.current = 'before';
    setCurrentPageNumber(prev => Math.max(1, prev - 1));
    setLoadTrigger(prev => prev + 1);
  };

  const handleFirstPage = () => {
    paginationModeRef.current = 'first';
    afterCursorRef.current = null;
    beforeCursorRef.current = null;
    setCurrentPageNumber(1);
    setLoadTrigger(prev => prev + 1);
  };

  const handlePageSizeChange = (size: number) => {
    paginationModeRef.current = 'first';
    afterCursorRef.current = null;
    beforeCursorRef.current = null;
    setPageSize(size);
    setCurrentPageNumber(1);
    if (typeof window !== 'undefined') {
      localStorage.setItem('transfers-page-size', size.toString());
    }
  };

  const handleSort = (field: string) => {
    paginationModeRef.current = 'first';
    afterCursorRef.current = null;
    beforeCursorRef.current = null;
    setCurrentPageNumber(1);
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleColumnVisibilityChange = (column: keyof ColumnVisibility, visible: boolean) => {
    const newVisibility = { ...columnVisibility, [column]: visible };
    setColumnVisibility(newVisibility);
    if (typeof window !== 'undefined') {
      localStorage.setItem('transfers-column-visibility', JSON.stringify(newVisibility));
    }
  };

  const hasNext = currentPageNumber * pageSize < totalCount;
  const hasPrevious = currentPageNumber > 1;

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
