'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { paymentsApi, type GetPaymentDTO } from '@shared/api/payments';
import {
  PaymentViewActions,
  PaymentViewContent,
  PaymentViewError,
  PaymentViewHeader,
  PaymentViewLoading,
} from './components';

interface PaymentViewPageProps {
  paymentId: string;
}

export function PaymentViewPage({ paymentId }: PaymentViewPageProps) {
  const router = useRouter();
  const [payment, setPayment] = useState<GetPaymentDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загрузка данных платежа
  useEffect(() => {
    const loadPayment = async () => {
      try {
        setLoading(true);
        setError(null);

        const paymentData = await paymentsApi.getPaymentById(paymentId);

        setPayment(paymentData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки платежа');
      } finally {
        setLoading(false);
      }
    };

    if (paymentId) {
      loadPayment();
    }
  }, [paymentId]);

  // Обработчик возврата к списку
  const handleBackToList = () => {
    router.push('/payments');
  };

  if (loading) {
    return <PaymentViewLoading />;
  }

  if (error) {
    return (
      <PaymentViewError 
        error={error} 
        onRetry={() => window.location.reload()}
        onBack={handleBackToList}
      />
    );
  }

  if (!payment) {
    return (
      <PaymentViewError 
        error="Платеж не найден" 
        onBack={handleBackToList}
      />
    );
  }

  return (
    <div className='pr-2 border rounded-2xl overflow-hidden shadow-sm h-full bg-white flex flex-col gap-6 p-6 overflow-y-auto'>
      {/* Заголовок */}
      <PaymentViewHeader payment={payment} />

      {/* Двухколоночный layout */}
      <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
        {/* Левая колонка - основная информация (3/4 ширины) */}
        <div className='lg:col-span-3'>
          <PaymentViewContent payment={payment} />
        </div>

        {/* Правая колонка - кнопки действий (1/4 ширины) */}
        <div className='lg:col-span-1'>
          <PaymentViewActions
            payment={payment}
            onBack={handleBackToList}
          />
        </div>
      </div>
    </div>
  );
}
