'use client';

import { useState, useEffect, useCallback } from 'react';
import { logger } from '@shared/lib';
import { routesApi } from '@shared/api/routes';
import type { RouteDTO } from '@entities/routes/interface/PartnerRouteDTO';

export const useRoutes = () => {
  const [routes, setRoutes] = useState<RouteDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoutes = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await routesApi.getRoutes();

      setRoutes(data.data);
    } catch (err) {
      const errorMessage = err instanceof Error
        ? err.message
        : 'Произошла ошибка при загрузке направлений';

      setError(errorMessage);
      setRoutes([]);
      logger.error('Ошибка загрузки направлений:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  return {
    routes,
    isLoading,
    error,
    refetch: fetchRoutes,
  };
};
