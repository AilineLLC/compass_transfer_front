import { CustomerOrderFormsTable } from '@features/customer-order-forms';
import type { CustomerOrderFormStatus } from '@shared/api/customer-order-forms';

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
        <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
          <div className='flex flex-col'>
            <h1 className='text-3xl font-bold tracking-tight'>Заявки</h1>
            <p className='text-muted-foreground'>Заявки клиентов на создание заказа</p>
          </div>
        </div>

        <div className='mt-4'>
          <CustomerOrderFormsTable initialStatus={status} />
        </div>
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Заявки | Compass Admin',
  description: 'Заявки клиентов на создание заказа',
};
