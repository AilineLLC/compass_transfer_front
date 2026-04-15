'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  transferReservationsApi,
  type TransferReservationDTO,
  type TransferReservationFilters,
} from '@shared/api/transfer-reservations';

interface ColumnVisibility {
  status: boolean;
  customer: boolean;
  phone: boolean;
  reservedSeats: boolean;
  transfer: boolean;
  createdAt: boolean;
  actions: boolean;
}

export function useTransferReservationsTable() {
  const router = useRouter();

  const [reservations, setReservations] = useState<TransferReservationDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageNumber, setCurrentPageNumber] = useState(1);
  const [cursorsHistory, setCursorsHistory] = useState<number[]>([]);
  const [pageSize, setPageSize] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('transfer-reservations-page-size');
      return saved ? parseInt(saved, 10) : 10;
    }
    return 10;
  });
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('transfer-reservations-column-visibility');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // используем значения по умолчанию
        }
      }
    }
    return {
      status: true,
      customer: true,
      phone: true,
      reservedSeats: true,
      transfer: true,
      createdAt: true,
      actions: true,
    };
  });

  const loadingRef = useRef(false);

  const loadReservations = useCallback(async () => {
    if (loadingRef.current) return;

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const params: TransferReservationFilters = {
        page: currentPage,
        size: pageSize,
        sortBy,
        sortOrder: sortOrder === 'asc' ? 'Asc' : 'Desc',
      };
      if (statusFilter) params.status = statusFilter;

      const response = await transferReservationsApi.getReservations(params);
      setReservations(response.data);
      setTotalCount(response.totalCount);
      setHasNext(response.hasNext);
      setHasPrevious(response.hasPrevious);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [currentPage, pageSize, sortBy, sortOrder, statusFilter]);

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

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
      localStorage.setItem('transfer-reservations-page-size', size.toString());
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

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    handleFirstPage();
  };

  const handleColumnVisibilityChange = (column: keyof ColumnVisibility, visible: boolean) => {
    const newVisibility = { ...columnVisibility, [column]: visible };
    setColumnVisibility(newVisibility);
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'transfer-reservations-column-visibility',
        JSON.stringify(newVisibility),
      );
    }
  };

  return {
    reservations,
    loading,
    error,

    pageSize,
    totalCount,
    hasNext,
    hasPrevious,
    currentPageNumber,

    statusFilter,
    sortBy,
    sortOrder,
    columnVisibility,

    handleNextPage,
    handlePrevPage,
    handleFirstPage,
    handlePageSizeChange,
    handleSort,
    handleStatusFilterChange,
    handleColumnVisibilityChange,

    loadReservations,
    refetch: loadReservations,
    router,
  };
}
