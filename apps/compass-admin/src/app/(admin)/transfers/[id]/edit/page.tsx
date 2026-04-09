'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { transfersApi, type GetTransferDTO } from '@shared/api/transfers';
import { TransferCreateForm } from '@features/transfers';

export default function TransferEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [transfer, setTransfer] = useState<GetTransferDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    transfersApi.getTransferById(id)
      .then(setTransfer)
      .catch(err => setError(err instanceof Error ? err.message : 'Ошибка загрузки'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className='flex flex-col border rounded-2xl h-full overflow-hidden bg-white items-center justify-center gap-3'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary' />
        <p className='text-sm text-muted-foreground'>Загрузка трансфера...</p>
      </div>
    );
  }

  if (error || !transfer) {
    return (
      <div className='flex flex-col border rounded-2xl h-full overflow-hidden bg-white items-center justify-center gap-3'>
        <p className='text-red-600 font-medium'>{error ?? 'Трансфер не найден'}</p>
        <button
          onClick={() => router.push('/transfers')}
          className='text-sm text-primary underline'
        >
          Вернуться к списку
        </button>
      </div>
    );
  }

  return <TransferCreateForm mode='edit' initialData={transfer} />;
}
