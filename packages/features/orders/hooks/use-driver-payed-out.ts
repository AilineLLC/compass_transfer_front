'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import OrdersApi from '@entities/orders/api/orders';
import type { GetOrderDTO } from '@entities/orders';

export const DRIVER_PAYED_OUT_COLOR = '#06b6d4';

interface UseDriverPayedOutProps {
  onSuccess?: () => void;
}

export function useDriverPayedOut({ onSuccess }: UseDriverPayedOutProps = {}) {
  const [isPending, setIsPending] = useState(false);

  const toggleDriverPayedOut = async (order: GetOrderDTO) => {
    const next = !order.driverPayedOut;

    setIsPending(true);
    try {
      await OrdersApi.markDriverPayedOut(order.id, next);
      await OrdersApi.markOrder(order.id, next ? DRIVER_PAYED_OUT_COLOR : null);

      toast.success(
        next
          ? `Выплата водителю по заказу №${order.orderNumber} отмечена`
          : `Отметка выплаты по заказу №${order.orderNumber} снята`,
      );
      onSuccess?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ошибка при изменении статуса выплаты';
      toast.error(message);
    } finally {
      setIsPending(false);
    }
  };

  return { toggleDriverPayedOut, isPending };
}
