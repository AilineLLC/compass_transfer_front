import { useState, useEffect, useCallback, useRef } from 'react';
import { driverQueueApi, type QueueStatusResponse } from '@shared/api/driver-queue';

interface UseDriverQueueReturn {
  queueData: QueueStatusResponse | null;
  isInQueue: boolean;
  isLoading: boolean;
  error: string | null;
  joinQueue: (locationId: string) => Promise<void>;
  leaveQueue: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useDriverQueue(): UseDriverQueueReturn {
  const [queueData, setQueueData] = useState<QueueStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Водитель в очереди, если есть position или joinedAt (статус 200)
  // Если есть orderId или id заказа - это активный заказ (статус 404 с данными)
  const isInQueue = queueData !== null && (
    queueData.position !== undefined ||
    queueData.joinedAt !== undefined
  ) && !queueData.orderId && !('id' in queueData);

  const checkQueueStatus = useCallback(async () => {
    try {
      setError(null);
      const status = await driverQueueApi.getQueueStatus();

      setQueueData(status);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка при получении статуса очереди';

      setError(errorMessage);
      setQueueData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const joinQueue = useCallback(async (locationId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await driverQueueApi.joinQueue(locationId);

      // Обновляем состояние с данными из ответа
      setQueueData({
        driverId: result.driverId,
        locationId: result.locationId,
        joinedAt: result.joinedAt,
        position: result.position || 1
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка при входе в очередь';

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const leaveQueue = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await driverQueueApi.leaveQueue();
      setQueueData(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка при выходе из очереди';

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    await checkQueueStatus();
  }, [checkQueueStatus]);

  // Автоматическое обновление статуса очереди каждые 5 секунд
  useEffect(() => {
    if (!isInQueue) {
      // Очищаем интервал если не в очереди
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      return;
    }

    // Запускаем периодическое обновление
    intervalRef.current = setInterval(() => {
      checkQueueStatus();
    }, 5000);

    // Cleanup при размонтировании или изменении isInQueue
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isInQueue, checkQueueStatus]);

  useEffect(() => {
    checkQueueStatus();
  }, [checkQueueStatus]);

  return {
    queueData,
    isInQueue,
    isLoading,
    error,
    joinQueue,
    leaveQueue,
    refetch
  };
}
