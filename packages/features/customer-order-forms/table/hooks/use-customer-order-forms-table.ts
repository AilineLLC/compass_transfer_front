'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  customerOrderFormsApi,
  type CustomerOrderFormDTO,
  type CustomerOrderFormFilters,
  type CustomerOrderFormStatus,
} from '@shared/api/customer-order-forms';

export function useCustomerOrderFormsTable(initialStatus?: CustomerOrderFormStatus) {
  const router = useRouter();

  const [forms, setForms] = useState<CustomerOrderFormDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageNumber, setCurrentPageNumber] = useState(1);
  const [cursorsHistory, setCursorsHistory] = useState<number[]>([]);
  const [pageSize, setPageSize] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('order-forms-page-size');
      return saved ? parseInt(saved, 10) : 10;
    }
    return 10;
  });
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  const [statusFilter, setStatusFilter] = useState<CustomerOrderFormStatus | undefined>(initialStatus);
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const loadingRef = useRef(false);

  const loadForms = useCallback(async () => {
    if (loadingRef.current) return;

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const params: CustomerOrderFormFilters = {
        page: currentPage,
        size: pageSize,
        sortBy,
        sortOrder: sortOrder === 'asc' ? 'Asc' : 'Desc',
        ...(statusFilter ? { status: statusFilter } : {}),
      };

      const response = await customerOrderFormsApi.getForms(params);

      setForms(response.data);
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
    loadForms();
  }, [loadForms]);

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
      localStorage.setItem('order-forms-page-size', size.toString());
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

  const handleStatusFilterChange = (status: CustomerOrderFormStatus | undefined) => {
    setStatusFilter(status);
    handleFirstPage();
  };

  return {
    forms,
    loading,
    error,

    pageSize,
    totalCount,
    hasNext,
    hasPrevious,
    currentPageNumber,

    sortBy,
    sortOrder,
    statusFilter,

    handleNextPage,
    handlePrevPage,
    handleFirstPage,
    handlePageSizeChange,
    handleSort,
    handleStatusFilterChange,

    loadForms,
    refetch: loadForms,
    router,
  };
}
