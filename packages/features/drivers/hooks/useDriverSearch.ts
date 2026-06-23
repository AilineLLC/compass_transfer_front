'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '@shared/api';
import { logger } from '@shared/lib';
import type { GetDriverDTO } from '@entities/users/interface';

export interface DriverSearchParams {
  vehicleServiceClass?: string[];
  licenseCategories?: string[];
  drivingExperience?: number;
  drivingExperienceOp?: 'GreaterThan' | 'GreaterThanOrEqual' | 'Equal' | 'LessThanOrEqual' | 'LessThan';
  preferredWorkZone?: string[];
  languages?: string[];
  email?: string;
  emailOp?: 'Equals' | 'NotEquals' | 'Contains' | 'NotContains' | 'StartsWith' | 'EndsWith' | 'IsEmpty' | 'IsNotEmpty';
  fullName?: string;
  fullNameOp?: 'Equals' | 'NotEquals' | 'Contains' | 'NotContains' | 'StartsWith' | 'EndsWith' | 'IsEmpty' | 'IsNotEmpty';
  phoneNumber?: string;
  phoneNumberOp?: 'Equals' | 'NotEquals' | 'Contains' | 'NotContains' | 'StartsWith' | 'EndsWith' | 'IsEmpty' | 'IsNotEmpty';
  online?: boolean;
  role?: string[];
  sortBy?: string;
  sortOrder?: 'Asc' | 'Desc';
  hasNoScheduledOrdersFrom?: string;
  hasNoScheduledOrdersTo?: string;
}

/**
 * Расширенный тип для API запроса с параметрами пагинации
 */
type DriverSearchApiParams = Omit<DriverSearchParams, 'hasNoScheduledOrdersFrom' | 'hasNoScheduledOrdersTo'> & {
  First?: boolean;
  Size?: number;
  HasNoScheduledOrdersFrom?: string;
  HasNoScheduledOrdersTo?: string;
};

/**
 * Хук для поиска водителей
 */
export const useDriverSearch = () => {
  const [drivers, setDrivers] = useState<GetDriverDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Поиск водителей с параметрами
   */
  const searchDrivers = useCallback(async (params: DriverSearchParams = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const { hasNoScheduledOrdersFrom, hasNoScheduledOrdersTo, ...rest } = params;
      const searchParams: DriverSearchApiParams = {
        First: true,
        Size: 50,
        ...rest,
        ...(hasNoScheduledOrdersFrom && { HasNoScheduledOrdersFrom: hasNoScheduledOrdersFrom }),
        ...(hasNoScheduledOrdersTo && { HasNoScheduledOrdersTo: hasNoScheduledOrdersTo }),
      };

      const response = await apiClient.get<{
        data: GetDriverDTO[];
        totalCount: number;
      }>('/User/Driver', { params: searchParams });

      if (response.error) {
        throw new Error(response.error.message || 'Ошибка при поиске водителей');
      }

      const driversData = Array.isArray(response.data?.data) ? response.data.data : [];

      setDrivers(driversData);
      
      logger.log('Найдено водителей:', driversData.length);

      return driversData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка при поиске водителей';

      setError(errorMessage);
      logger.error('Ошибка при поиске водителей:', err);

      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Поиск водителей по имени
   */
  const searchDriversByName = useCallback(async (name: string) => {
    if (!name.trim()) {
      setDrivers([]);
      
      return [];
    }

    return searchDrivers({
      fullName: name.trim(),
      fullNameOp: 'Contains'
    });
  }, [searchDrivers]);

  /**
   * Поиск онлайн водителей
   */
  const searchOnlineDrivers = useCallback(async () => {
    return searchDrivers({
      online: true,
      role: ['Driver']
    });
  }, [searchDrivers]);

  return {
    drivers,
    isLoading,
    error,
    searchDrivers,
    searchDriversByName,
    searchOnlineDrivers,
  };
};
