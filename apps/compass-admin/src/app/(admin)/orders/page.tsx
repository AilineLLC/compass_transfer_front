import { OrdersTable, OrdersStats } from '@features/orders';
import { CreateOrderButton } from './create-order-button';

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    orderNumber?: string;
    type?: string;
    status?: string;
    subStatus?: string;
    creatorId?: string;
    airFlight?: string;
    flyReis?: string;
  }>;
}) {
  const params = await searchParams;

  return (
    <div className='flex flex-col border rounded-2xl h-full overflow-hidden pr-2 bg-white'>
      <div className='flex flex-col overflow-y-auto pl-4 pr-2 py-4'>
        <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
          <div className='flex flex-col'>
            <h1 className='text-3xl font-bold tracking-tight'>Заказы</h1>
            <p className='text-muted-foreground'>Управление заказами системы</p>
          </div>

          <CreateOrderButton />
        </div>
        <OrdersStats className='my-4' activeStatus={params.status} />

        <OrdersTable initialFilters={params} />
      </div>
    </div>
  );
}
