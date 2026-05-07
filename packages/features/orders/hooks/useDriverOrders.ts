'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from 'date-fns';
import type { GetOrderDTO } from '@entities/orders/interface';
import { driverActiveOrdersApi } from '@shared/api/orders';

export type PeriodType = 'day' | 'week' | 'month' | 'custom';

interface UseDriverOrdersOptions {
  driverId?: string | null;
  period?: PeriodType;
  customFrom?: Date | null;
  customTo?: Date | null;
}

interface UseDriverOrdersResult {
  orders: GetOrderDTO[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDriverOrders({
  driverId,
  period = 'week',
  customFrom,
  customTo,
}: UseDriverOrdersOptions): UseDriverOrdersResult {
  const [orders, setOrders] = useState<GetOrderDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getDateRange = useCallback((): { from: Date; to: Date } => {
    const now = new Date();

    switch (period) {
      case 'day':
        return { from: startOfDay(now), to: endOfDay(now) };
      case 'week':
        return {
          from: startOfWeek(now, { weekStartsOn: 1 }),
          to: endOfWeek(now, { weekStartsOn: 1 }),
        };
      case 'month':
        return { from: startOfMonth(now), to: endOfMonth(now) };
      case 'custom':
        return {
          from: customFrom ? startOfDay(customFrom) : startOfDay(now),
          to: customTo ? endOfDay(customTo) : endOfDay(now),
        };
    }
  }, [period, customFrom, customTo]);

  const fetchOrders = useCallback(async () => {
    if (!driverId) {
      setOrders([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { from, to } = getDateRange();
      const response = await driverActiveOrdersApi.getDriverOrders(driverId, {
        scheduledTimeFrom: from.toISOString(),
      });

      const filtered = response.data.filter(order => {
        if (!order.scheduledTime) return false;
        const t = new Date(order.scheduledTime);

        return t >= from && t <= to;
      });

      setOrders(filtered);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки заказов');
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [driverId, getDateRange]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, isLoading, error, refetch: fetchOrders };
}
