'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { routesApi } from '@shared/api/routes';
import type { RouteDTO } from '@entities/routes/interface/PartnerRouteDTO';

interface ColumnVisibility {
  name: boolean;
  startLocation: boolean;
  endLocation: boolean;
  price: boolean;
  duration: boolean;
  isPopular: boolean;
  actions: boolean;
}

export function useRoutesTable() {
  const router = useRouter();

  const [routes, setRoutes] = useState<RouteDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTermState] = useState('');
  const [isPopularFilter, setIsPopularFilterState] = useState<boolean | null>(null);

  const [currentPageNumber, setCurrentPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('routes-page-size');
      const parsed = parseInt(saved ?? '', 10);

      if (!isNaN(parsed) && parsed > 0) return parsed;
    }

    return 10;
  });

  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('routes-column-visibility');

      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // ignore
        }
      }
    }

    return {
      name: true,
      startLocation: true,
      endLocation: true,
      price: true,
      duration: true,
      isPopular: true,
      actions: true,
    };
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const routesData = await routesApi.getRoutes();

      setRoutes(routesData.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredRoutes = useMemo(() => {
    let result = [...routes];

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();

      result = result.filter(r =>
        r.name.toLowerCase().includes(lower) ||
        (r.startLocation?.name ?? '').toLowerCase().includes(lower) ||
        (r.endLocation?.name ?? '').toLowerCase().includes(lower),
      );
    }

    if (isPopularFilter !== null) {
      result = result.filter(r => r.isPopular === isPopularFilter);
    }

    result.sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';

      if (sortBy === 'name') { aVal = a.name; bVal = b.name; }
      else if (sortBy === 'price') { aVal = a.price; bVal = b.price; }
      else if (sortBy === 'duration') { aVal = a.duration ?? 0; bVal = b.duration ?? 0; }   

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;

      return 0;
    });

    return result;
  }, [routes, searchTerm, isPopularFilter, sortBy, sortOrder]);

  const totalCount = filteredRoutes.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNext = currentPageNumber < totalPages;
  const hasPrevious = currentPageNumber > 1;

  const paginatedRoutes = useMemo(() => {
    const start = (currentPageNumber - 1) * pageSize;

    return filteredRoutes.slice(start, start + pageSize);
  }, [filteredRoutes, currentPageNumber, pageSize]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleNextPage = () => {
    if (hasNext) setCurrentPageNumber(prev => prev + 1);
  };

  const handlePrevPage = () => {
    if (hasPrevious) setCurrentPageNumber(prev => prev - 1);
  };

  const handleFirstPage = () => setCurrentPageNumber(1);

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPageNumber(1);

    if (typeof window !== 'undefined') {
      localStorage.setItem('routes-page-size', size.toString());
    }
  };

  const handleColumnVisibilityChange = (column: keyof ColumnVisibility, visible: boolean) => {
    setColumnVisibility(prev => {
      const next = { ...prev, [column]: visible };

      if (typeof window !== 'undefined') {
        localStorage.setItem('routes-column-visibility', JSON.stringify(next));
      }

      return next;
    });
  };

  const setSearchTerm = (term: string) => {
    setSearchTermState(term);
    setCurrentPageNumber(1);
  };

  const setIsPopularFilter = (val: boolean | null) => {
    setIsPopularFilterState(val);
    setCurrentPageNumber(1);
  };

  return {
    paginatedRoutes,
    loading,
    error,
    searchTerm,
    isPopularFilter,
    currentPageNumber,
    pageSize,
    totalCount,
    hasNext,
    hasPrevious,
    sortBy,
    sortOrder,
    columnVisibility,
    setSearchTerm,
    setIsPopularFilter,
    handleSort,
    handleNextPage,
    handlePrevPage,
    handleFirstPage,
    handlePageSizeChange,
    handleColumnVisibilityChange,
    loadData,
    router,
  };
}
