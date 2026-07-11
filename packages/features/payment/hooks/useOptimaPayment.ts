import { useCallback, useEffect, useState, useRef } from 'react';
import { toast } from '@shared/lib/conditional-toast';
import { useSignalR } from '@shared/hooks/signal/useSignalR';
import { paymentService } from '@entities/payments/api/payment-service';

export type PaymentState =
  | { status: 'idle' }
  | { status: 'generating'; sum: number }
  | { status: 'waiting'; transactionId: string; qrBase64: string; sum: number }
  | { status: 'processing'; paymentId: string; transactionId: string }
  | { status: 'completed'; paymentId: string; transactionId: string; sum: number }
  | { status: 'failed'; error: string }
  | { status: 'expired'; transactionId: string };

interface UseOptimaPaymentResult {
  state: PaymentState;
  generateQR: (sum: number, note: string) => Promise<void>;
  cancelPayment: () => Promise<void>;
  reset: () => void;
}

/**
 * Хук для управления платежами через Optima QR
 * Следует принципу единственной ответственности - только платежи
 *
 * ИСПРАВЛЕНО: Использует правильные поля API (sum, note)
 */
export const useOptimaPayment = (): UseOptimaPaymentResult => {
  const [state, setState] = useState<PaymentState>({ status: 'idle' });
  const signalR = useSignalR();
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Обработчик уведомления о получении платежа
  const handlePaymentReceived = useCallback(
    (notification: unknown) => {
      const n = notification as { type?: string; data?: { paymentId?: string; transactionId?: string } };
      if (n?.type !== 'PaymentReceived') return;

      const paymentId = n.data?.paymentId ?? '';
      const transactionId = n.data?.transactionId ?? '';

      if (state.status === 'waiting' && state.transactionId === transactionId) {
        setState({
          status: 'completed',
          paymentId,
          transactionId,
          sum: state.sum,
        });
      }
    },
    [state],
  );

  // Подписка на WebSocket уведомления
  useEffect(() => {
    if (signalR.isConnected && state.status === 'waiting') {
      signalR.on('New', handlePaymentReceived);

      return () => {
        signalR.off('New', handlePaymentReceived);
      };
    }
  }, [signalR, signalR.isConnected, state.status, handlePaymentReceived]);

  // Таймаут для истечения QR-кода
  useEffect(() => {
    if (state.status === 'waiting') {
      // Устанавливаем таймаут на 2 минут
      timeoutRef.current = setTimeout(
        () => {
          setState({
            status: 'expired',
            transactionId: state.transactionId,
          });
          toast.error('Время ожидания платежа истекло');
        },
        2 * 60 * 1000,
      );

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }
  }, [state]);

  const generateQR = useCallback(async (sum: number, note: string) => {
    try {
      setState({ status: 'generating', sum });
      
      const response = await paymentService.generateOptimaQR(sum, note);
      
      // Переходим в состояние ожидания с полученными данными
      setState({
        status: 'waiting',
        transactionId: response.transactionId,
        qrBase64: response.qrBase64,
        sum
      });
    } catch (error) {
      console.error('Ошибка генерации QR:', error);
      setState({
        status: 'failed',
        error: error instanceof Error ? error.message : 'Неизвестная ошибка'
      });
    }
  }, []);

  // Отмена платежа (локально, без API запроса)
  const cancelPayment = useCallback(async () => {
    // API не поддерживает отмену платежей, просто сбрасываем локальное состояние

    // Очищаем таймаут если он есть
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Сбрасываем состояние
    setState({ status: 'idle' });
  }, []);

  // Сброс состояния
  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setState({ status: 'idle' });
  }, []);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    state,
    generateQR,
    cancelPayment,
    reset,
  };
};
