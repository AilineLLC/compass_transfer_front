'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { locationGroupsApi } from '@shared/api/location-groups';
import type { LocationGroupDTO } from '@shared/api/location-groups';

const PAGE_SIZE = 20;

export function useAreasTable() {
  const router = useRouter();
  const [areas, setAreas] = useState<LocationGroupDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [currentCursor, setCurrentCursor] = useState<string | undefined>(undefined);
  const [cursorsStack, setCursorsStack] = useState<string[]>([]);
  const [currentPageNumber, setCurrentPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'Asc' | 'Desc'>('Asc');

  const loadAreas = useCallback(async (cursor?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await locationGroupsApi.getLocationGroups({
        after: cursor,
        size: pageSize,
        name: searchTerm || undefined,
        city: cityFilter || undefined,
        sortBy,
        sortOrder,
        first: !cursor,
      });
      setAreas(response.data);
      setTotalCount(response.totalCount);
      setHasNext(response.hasNext);
      setHasPrevious(response.hasPrevious);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки областей');
    } finally {
      setLoading(false);
    }
  }, [pageSize, searchTerm, cityFilter, sortBy, sortOrder]);

  useEffect(() => {
    loadAreas();
  }, [loadAreas]);

  const handleNextPage = useCallback(() => {
    if (!hasNext || areas.length === 0) return;
    const lastId = areas[areas.length - 1].id;
    setCursorsStack(prev => [...prev, currentCursor ?? '']);
    setCurrentCursor(lastId);
    setCurrentPageNumber(prev => prev + 1);
    loadAreas(lastId);
  }, [hasNext, areas, currentCursor, loadAreas]);

  const handlePrevPage = useCallback(() => {
    if (!hasPrevious) return;
    const newStack = [...cursorsStack];
    const prevCursor = newStack.pop();
    setCursorsStack(newStack);
    setCurrentCursor(prevCursor);
    setCurrentPageNumber(prev => prev - 1);
    loadAreas(prevCursor);
  }, [hasPrevious, cursorsStack, loadAreas]);

  const handleFirstPage = useCallback(() => {
    setCursorsStack([]);
    setCurrentCursor(undefined);
    setCurrentPageNumber(1);
    loadAreas();
  }, [loadAreas]);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    handleFirstPage();
  }, [handleFirstPage]);

  const handleSort = useCallback((field: string) => {
    setSortBy(field);
    setSortOrder(prev => (sortBy === field && prev === 'Asc' ? 'Desc' : 'Asc'));
    handleFirstPage();
  }, [sortBy, handleFirstPage]);

  return {
    areas, loading, error, totalCount, hasNext, hasPrevious,
    currentPageNumber, pageSize, searchTerm, cityFilter, sortBy, sortOrder,
    setSearchTerm, setCityFilter,
    handleNextPage, handlePrevPage, handleFirstPage, handlePageSizeChange, handleSort,
    loadAreas, router,
  };
}
