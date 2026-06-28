'use client';

import { useState, useEffect, useMemo } from 'react';
import type { RoutePoint } from '../types';

/**
 * Хук для построения маршрута между точками
 */
export const useRouteBuilder = (showRoute: boolean, routePoints: RoutePoint[]) => {
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [routeDistance, setRouteDistance] = useState<number>(0); // в метрах
  const [routeLegs, setRouteLegs] = useState<{ distance: number }[]>([]);
  const [routeStatus, setRouteStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // Мемоизируем точки с локациями для предотвращения лишних перерасчетов
  const validRoutePoints = useMemo(() => {
    return routePoints.filter(point =>
      point.latitude &&
      point.longitude &&
      typeof point.latitude === 'number' &&
      typeof point.longitude === 'number'
    );
  }, [routePoints]);

  // Мемоизируем строку координат для сравнения изменений
  const coordinatesKey = useMemo(() => {
    return validRoutePoints
      .map(point => `${point.latitude},${point.longitude}`)
      .join('|');
  }, [validRoutePoints]);

  useEffect(() => {
    if (!showRoute || validRoutePoints.length < 2) {
      setRouteCoordinates([]);
      setRouteDistance(0);
      setRouteStatus('idle');

      return;
    }

    let isCancelled = false;
    const controller = new AbortController();

    const buildRoute = async (signal: AbortSignal) => {
      try {
        // Сразу очищаем старый маршрут и показываем загрузку
        setRouteCoordinates([]);
        setRouteLegs([]);
        setRouteStatus('loading');

        // Используем улучшенный сервис роутинга
        const { routingService } = await import('../services/routingService');
        const { RouteType } = await import('../types');

        const routeResult = await routingService.buildRoute(validRoutePoints, RouteType.FASTEST);

        if (!signal.aborted && !isCancelled) {
          setRouteCoordinates(routeResult.coordinates);
          setRouteDistance(routeResult.distance);
          setRouteLegs(routeResult.legs ?? []);
          setRouteStatus('success');
        }
      } catch (error) {
        console.error('❌ Ошибка построения маршрута:', error);

        if (!signal.aborted && !isCancelled) {
          setRouteCoordinates([]);
          setRouteDistance(0);
          setRouteLegs([]);
          setRouteStatus('error');
        }
      }
    };

    buildRoute(controller.signal);

    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [showRoute, validRoutePoints, coordinatesKey]);

  return { routeCoordinates, routeDistance, routeLegs, routeStatus };
};
