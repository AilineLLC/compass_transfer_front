'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditApi } from '../api/audit-api';
import type { AuditFilters } from '../interface';

export function useAuditEvents(baseFilters: AuditFilters = {}, enabled = true) {
  const [cursor, setCursor] = useState<string | null>(null);
  const [cursorsHistory, setCursorsHistory] = useState<(string | null)[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const filters: AuditFilters = {
    size: 10,
    sortBy: 'date',
    sortOrder: 'Desc',
    ...baseFilters,
    ...(cursor ? { after: cursor } : { first: true }),
  };

  const query = useQuery({
    queryKey: ['audit-events', filters],
    queryFn: () => auditApi.getAuditEvents(filters),
    enabled,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const goToNextPage = useCallback(() => {
    if (!query.data?.hasNext) return;
    const lastItem = query.data.data[query.data.data.length - 1];
    if (lastItem) {
      setCursorsHistory(prev => [...prev, cursor]);
      setCursor(lastItem.id);
      setCurrentPage(prev => prev + 1);
    }
  }, [query.data, cursor]);

  const goToPrevPage = useCallback(() => {
    if (cursorsHistory.length === 0) return;
    const prevCursor = cursorsHistory[cursorsHistory.length - 1] ?? null;
    setCursorsHistory(prev => prev.slice(0, -1));
    setCursor(prevCursor);
    setCurrentPage(prev => prev - 1);
  }, [cursorsHistory]);

  return {
    events: query.data?.data ?? [],
    totalCount: query.data?.totalCount ?? 0,
    hasNext: query.data?.hasNext ?? false,
    hasPrevious: currentPage > 1,
    isLoading: query.isLoading,
    isError: query.isError,
    currentPage,
    goToNextPage,
    goToPrevPage,
    refetch: query.refetch,
  };
}
