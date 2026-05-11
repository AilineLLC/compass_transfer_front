'use client';

import { useState, useEffect } from 'react';
import { Handshake, ArrowLeft } from 'lucide-react';
import { Button } from '@shared/ui/forms/button';
import { CustomerOrderFormsTable } from '@features/customer-order-forms';
import { PartnerContactFormsTable } from '@features/partner-contact-forms';
import { partnerContactFormsApi } from '@shared/api/partner-contact-forms';
import type { CustomerOrderFormStatus } from '@shared/api/customer-order-forms';

interface OrderFormsPageClientProps {
  initialStatus?: CustomerOrderFormStatus;
}

export function OrderFormsPageClient({ initialStatus }: OrderFormsPageClientProps) {
  const [showPartner, setShowPartner] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    partnerContactFormsApi
      .getForms({ status: 'Pending', size: 1 })
      .then(res => setPendingCount(res.totalCount))
      .catch(() => setPendingCount(0));
  }, []);

  return (
    <>
      {showPartner ? (
        <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
          <div className='flex items-center gap-3'>
            <Button
              variant='ghost'
              size='sm'
              className='gap-1.5 text-muted-foreground hover:text-foreground -ml-1'
              onClick={() => setShowPartner(false)}
            >
              <ArrowLeft className='h-4 w-4' />
              Назад к заявкам
            </Button>
          </div>
          <div className='flex flex-col'>
            <h1 className='text-3xl font-bold tracking-tight'>Заявки на партнерство</h1>
            <p className='text-muted-foreground'>Входящие заявки от потенциальных партнёров</p>
          </div>
        </div>
      ) : (
        <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
          <div className='flex flex-col'>
            <h1 className='text-3xl font-bold tracking-tight'>Заявки</h1>
            <p className='text-muted-foreground'>Заявки клиентов на создание заказа</p>
          </div>

          <Button
            variant='outline'
            className='relative w-full md:w-auto gap-2'
            onClick={() => setShowPartner(true)}
          >
            <Handshake className='h-4 w-4' />
            Заявки на партнерство
            {pendingCount > 0 && (
              <span className='absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-semibold text-white'>
                {pendingCount > 99 ? '99+' : pendingCount}
              </span>
            )}
          </Button>
        </div>
      )}

      <div className='mt-4'>
        {showPartner ? (
          <PartnerContactFormsTable />
        ) : (
          <CustomerOrderFormsTable initialStatus={initialStatus} />
        )}
      </div>
    </>
  );
}
