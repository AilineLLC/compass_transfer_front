import { TransferReservationsTable } from '@features/transfer-reservations';

export default function TransferReservationsPage() {
  return (
    <div className='flex flex-col border rounded-2xl h-full overflow-hidden pr-2 bg-white'>
      <div className='flex flex-col overflow-y-auto pl-4 pr-2 py-4'>
        <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
          <div className='flex flex-col'>
            <h1 className='text-3xl font-bold tracking-tight'>Заявки на трансфер</h1>
            <p className='text-muted-foreground'>Управление заявками от клиентов</p>
          </div>
        </div>

        <div className='mt-4'>
          <TransferReservationsTable />
        </div>
      </div>
    </div>
  );
}
