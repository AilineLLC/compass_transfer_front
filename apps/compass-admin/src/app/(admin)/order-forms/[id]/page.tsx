'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { customerOrderFormsApi, type CustomerOrderFormDTO } from '@shared/api/customer-order-forms';
import { CustomerOrderFormView } from '@features/customer-order-forms';

export default function OrderFormDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [form, setForm] = useState<CustomerOrderFormDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    customerOrderFormsApi
      .getFormById(id)
      .then(setForm)
      .catch(err => setError(err instanceof Error ? err.message : 'Ошибка загрузки'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className='flex flex-col border rounded-2xl h-full overflow-hidden bg-white items-center justify-center gap-3'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary' />
        <p className='text-sm text-muted-foreground'>Загрузка заявки...</p>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className='flex flex-col border rounded-2xl h-full overflow-hidden bg-white items-center justify-center gap-3'>
        <p className='text-red-600 font-medium'>{error ?? 'Заявка не найдена'}</p>
        <button
          onClick={() => router.push('/order-forms')}
          className='text-sm text-primary underline'
        >
          Вернуться к списку
        </button>
      </div>
    );
  }

  return <CustomerOrderFormView form={form} />;
}
