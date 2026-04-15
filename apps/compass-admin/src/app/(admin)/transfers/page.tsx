import Link from 'next/link';
import { TransfersTable } from '@features/transfers';
import { Button } from '@shared/ui/forms/button';
import { Plus } from 'lucide-react';

export default function TransfersPage() {
  return (
    <div className='flex flex-col border rounded-2xl h-full overflow-hidden pr-2 bg-white'>
      <div className='flex flex-col overflow-y-auto pl-4 pr-2 py-4'>
        <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
          <div className='flex flex-col'>
            <h1 className='text-3xl font-bold tracking-tight'>Трансферы</h1>
            <p className='text-muted-foreground'>Управление трансферами системы</p>
          </div>

          <Link href='/transfers/create'>
            <Button className='w-full md:w-auto focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md focus:shadow-md focus-visible:shadow-md transition-shadow'>
              <Plus className='mr-2 h-4 w-4' />
              Создать трансфер
            </Button>
          </Link>
        </div>

        <div className='mt-4'>
          <TransfersTable />
        </div>
      </div>
    </div>
  );
}
