'use client'

import { useState, useCallback } from 'react';
import { apiClient } from '@shared/api';
import { logger } from '@shared/lib';
import type { LocationType } from '@entities/locations/enums';
import type { GetLocationDTO } from '@entities/locations/interface';

/**
 * Хук для работы с локациями
 */
export const useLocations = () => {
  const [locations, setLocations] = useState<GetLocationDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /**
   * Загружает список всех локаций
   */
  const fetchLocations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<{
        data: GetLocationDTO[];
        totalCount: number;
        pageSize: number;
        hasPrevious: boolean;
        hasNext: boolean;
      }>('/Location');

      if (response.error) {
        throw new Error(response.error.message || 'Ошибка при загрузке локаций');
      }
      // API возвращает объект с массивом data
      if (response.data && Array.isArray(response.data.data)) {
        setLocations(response.data.data);
        logger.log('Загружено локаций:', response.data.data.length);
      } else {
        logger.warn('Неожиданный формат данных от API локаций:', response.data);
        setLocations([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка при загрузке локаций';

      setError(errorMessage);
      logger.error('Ошибка при загрузке локаций:', err);
    } finally {
      setIsLoading(false);
    }
  };
  /**
   * Поиск локаций по строке и/или координатному прямоугольнику.
   * @param query Строка поиска (Address)
   * @param bounds Ограничивающий прямоугольник { latFrom, latTo, longFrom, longTo }
   */
  const searchLocations = async (
    query: string = '',
    bounds?: { latFrom: number; latTo: number; longFrom: number; longTo: number },
    additionalParams?: Record<string, string | number | boolean | string[]>,
  ): Promise<GetLocationDTO[]> => {
    try {
      // Базовые параметры
      const params: Record<string, string | number | boolean | string[]> = {
        First: true,
        Includes: ['Profile'],
      };

      // Если есть строка поиска – добавляем ограничение размера
      if (query.trim()) {
        params['Size'] = 20;
      }

      // if (query.trim()) {
      //   params['Address'] = query.trim();
      //   params['AddressOp'] = 'Contains';
      // }

      // Координатный прямоугольник
      if (bounds) {
        params['CoordinateBox.LatFrom'] = bounds.latFrom;
        params['CoordinateBox.LatTo'] = bounds.latTo;
        params['CoordinateBox.LongFrom'] = bounds.longFrom;
        params['CoordinateBox.LongTo'] = bounds.longTo;
      }

      // Дополнительные параметры
      if (additionalParams) {
        Object.assign(params, additionalParams);
      }

      const response = await apiClient.get<{
        data: GetLocationDTO[];
        totalCount: number;
      }>('/Location', { params });

      const results = Array.isArray(response.data?.data) ? response.data.data : [];

      // Кэшируем в локальном состоянии, если query пустой (начальный загруз) или если это первый запрос
      if (!query.trim()) {
        setLocations(results);
      }

      return results;
    } catch (err) {
      logger.error('Ошибка при поиске локаций через API:', err);

      return [];
    }
  };
  /**
   * Получить локацию по ID из загруженного списка
   */
  const getLocationById = (id: string): GetLocationDTO | undefined => {
    return locations.find(location => location.id === id);
  };
  /**
   * Получить локацию по ID через API
   */
  const fetchLocationById = useCallback(async (id: string): Promise<GetLocationDTO | null> => {
    try {
      const response = await apiClient.get<GetLocationDTO>(
        `/Location/${id}`.replace('{uuid}', id),
        { params: { Includes: ['Profile'] } },
      );

      if (response.error) {
        logger.error('Ошибка при получении локации:', response.error);

        return null;
      }

      return response.data as GetLocationDTO;
    } catch (error) {
      logger.error('Ошибка при получении локации по ID:', error);

      return null;
    }
  }, []);

  /**
   * Получить локации по типу
   */
  const fetchLocationsByType = useCallback(async (locationType: LocationType): Promise<GetLocationDTO[]> => {
    try {
      setIsLoading(true);
      setError(null);

      const params = {
        First: true,
        Size: 100, // Получаем больше локаций для конкретного типа
        Type: locationType,
      };

      const response = await apiClient.get<{
        data: GetLocationDTO[];
        totalCount: number;
        pageSize: number;
        hasPrevious: boolean;
        hasNext: boolean;
      }>('/Location', { params });

      if (response.error) {
        throw new Error(response.error.message || `Ошибка при загрузке локаций типа ${locationType}`);
      }

      const results = Array.isArray(response.data?.data) ? response.data.data : [];

      logger.log(`Загружено локаций типа ${locationType}:`, results.length);

      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Ошибка при загрузке локаций типа ${locationType}`;

      setError(errorMessage);
      logger.error(`Ошибка при загрузке локаций типа ${locationType}:`, err);

      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Загружает все локации в указанных границах для отображения на карте
   */
  const fetchLocationsInBounds = useCallback(async (bounds: {
    latFrom: number;
    latTo: number;
    longFrom: number;
    longTo: number;
  }): Promise<GetLocationDTO[]> => {
    try {
      const params = {
        First: true,
        Size: 1000, // Большой размер для карты
        'CoordinateBox.LatFrom': bounds.latFrom,
        'CoordinateBox.LatTo': bounds.latTo,
        'CoordinateBox.LongFrom': bounds.longFrom,
        'CoordinateBox.LongTo': bounds.longTo,
        IsActive: true, // Только активные локации
      };

      const response = await apiClient.get<{
        data: GetLocationDTO[];
        totalCount: number;
      }>('/Location', { params });

      const results = Array.isArray(response.data?.data) ? response.data.data : [];

      logger.log(`Загружено локаций в границах карты:`, results.length);

      return results;
    } catch (error) {
      logger.error('Ошибка загрузки локаций в границах:', error);
      
      return [];
    }
  }, []);

  /**
   * Загружает ВСЕ локации без ограничений по координатам
   */
  const fetchAllLocations = useCallback(async (): Promise<GetLocationDTO[]> => {
    try {
      const params = {
        First: true,
        Size: 5000, // Большой размер для всех локаций
        IsActive: true, // Только активные локации
        Includes: ['Profile'],
        // БЕЗ CoordinateBox - загружаем ВСЕ!
      };

      const response = await apiClient.get<{
        data: GetLocationDTO[];
        totalCount: number;
      }>('/Location', { params });

      const results = Array.isArray(response.data?.data) ? response.data.data : [];

      logger.log(`Загружено ВСЕХ локаций:`, results.length);

      return results;
    } catch (err) {
      logger.error('Ошибка загрузки всех локаций:', err);

      return [];
    }
  }, []);

  return {
    locations,
    isLoading,
    error,
    fetchLocations,
    searchLocations,
    getLocationById,
    fetchLocationById,
    fetchLocationsByType,
    fetchLocationsInBounds,
    fetchAllLocations, // Новая функция!
  };
};
