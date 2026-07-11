'use client';

import { useState, useCallback } from 'react';
import { locationGroupsApi } from '@shared/api/location-groups';
import type { LocationGroupDTO } from '@shared/api/location-groups';

export function useArea() {
  const [area, setArea] = useState<LocationGroupDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchArea = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await locationGroupsApi.getLocationGroupById(id);
      setArea(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки области');
    } finally {
      setLoading(false);
    }
  }, []);

  return { area, loading, error, fetchArea };
}
