'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  partnerContactFormsApi,
  type PartnerContactFormDTO,
  type PartnerContactFormFilters,
  type PartnerContactFormStatus,
} from '@shared/api/partner-contact-forms';

export function usePartnerContactFormsTable() {
  const [forms, setForms] = useState<PartnerContactFormDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageNumber, setCurrentPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('partner-contact-forms-page-size');
      return saved ? parseInt(saved, 10) : 10;
    }
    return 10;
  });
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  const [statusFilter, setStatusFilter] = useState<PartnerContactFormStatus | undefined>(undefined);
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const loadingRef = useRef(false);

  const loadForms = useCallback(async () => {
    if (loadingRef.current) return;

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const params: PartnerContactFormFilters = {
        page: currentPage,
        size: pageSize,
        sortBy,
        sortOrder: sortOrder === 'asc' ? 'Asc' : 'Desc',
        ...(statusFilter ? { status: statusFilter } : {}),
      };

      const response = await partnerContactFormsApi.getForms(params);

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
    setCurrentPage(prev => prev + 1);
    setCurrentPageNumber(prev => prev + 1);
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
    setCurrentPageNumber(prev => Math.max(1, prev - 1));
  };

  const handleFirstPage = () => {
    setCurrentPage(1);
    setCurrentPageNumber(1);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
    setCurrentPageNumber(1);
    if (typeof window !== 'undefined') {
      localStorage.setItem('partner-contact-forms-page-size', size.toString());
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

  const handleStatusFilterChange = (status: PartnerContactFormStatus | undefined) => {
    setStatusFilter(status);
    handleFirstPage();
  };

  const handleUpdateStatus = async (id: string, status: PartnerContactFormStatus) => {
    await partnerContactFormsApi.updateStatus(id, status);
    await loadForms();
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
    handleUpdateStatus,

    loadForms,
    refetch: loadForms,
  };
}
