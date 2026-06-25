'use client';

import { useState, useCallback } from 'react';
import { locationGroupsApi } from '@shared/api/location-groups';
import type { LocationGroupDTO } from '@shared/api/location-groups';

export function useAreas() {
  const [areas, setAreas] = useState<LocationGroupDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  const fetchAreas = useCallback(async (params?: { name?: string; city?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await locationGroupsApi.getLocationGroups(params);
      setAreas(response.data);
      setTotalCount(response.totalCount);
      setHasNext(response.hasNext);
      setHasPrevious(response.hasPrevious);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки областей');
    } finally {
      setLoading(false);
    }
  }, []);

  return { areas, loading, error, totalCount, hasNext, hasPrevious, fetchAreas };
}
