import type { CustomerOrderFormStatus } from '@shared/api/customer-order-forms';
import { OrderFormsPageClient } from './order-forms-page-client';

export default async function OrderFormsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const status = params.status as CustomerOrderFormStatus | undefined;

  return (
    <div className='flex flex-col border rounded-2xl h-full overflow-hidden pr-2 bg-white'>
      <div className='flex flex-col overflow-y-auto pl-4 pr-2 py-4'>
        <OrderFormsPageClient initialStatus={status} />
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Заявки | Compass Admin',
  description: 'Заявки клиентов на создание заказа',
};
