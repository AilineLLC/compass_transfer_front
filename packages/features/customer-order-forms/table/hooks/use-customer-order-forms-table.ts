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

  const paginationModeRef = useRef<'first' | 'after' | 'before'>('first');
  const afterCursorRef = useRef<string | null>(null);
  const beforeCursorRef = useRef<string | null>(null);
  const [loadTrigger, setLoadTrigger] = useState(0);
  const [currentPageNumber, setCurrentPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('order-forms-page-size');
      return saved ? parseInt(saved, 10) : 10;
    }
    return 10;
  });
  const [totalCount, setTotalCount] = useState(0);

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
        size: pageSize,
        sortBy,
        sortOrder: sortOrder === 'asc' ? 'Asc' : 'Desc',
        ...(statusFilter ? { status: statusFilter } : {}),
      };

      if (paginationModeRef.current === 'after' && afterCursorRef.current) {
        params.after = afterCursorRef.current;
      } else if (paginationModeRef.current === 'before' && beforeCursorRef.current) {
        params.before = beforeCursorRef.current;
      } else {
        params.first = true;
      }

      const response = await customerOrderFormsApi.getForms(params);

      setForms(response.data);
      setTotalCount(response.totalCount);

      if (response.data.length > 0) {
        afterCursorRef.current = response.data[response.data.length - 1].id;
        beforeCursorRef.current = response.data[0].id;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [loadTrigger, pageSize, sortBy, sortOrder, statusFilter]);

  useEffect(() => {
    loadForms();
  }, [loadForms]);

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
      localStorage.setItem('order-forms-page-size', size.toString());
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

  const handleStatusFilterChange = (status: CustomerOrderFormStatus | undefined) => {
    paginationModeRef.current = 'first';
    afterCursorRef.current = null;
    beforeCursorRef.current = null;
    setCurrentPageNumber(1);
    setStatusFilter(status);
  };

  const hasNext = currentPageNumber * pageSize < totalCount;
  const hasPrevious = currentPageNumber > 1;

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
