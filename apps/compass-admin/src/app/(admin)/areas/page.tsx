import { AreasTable } from '@features/areas/table/areas-table';
import { CreateAreaButton } from './create-area-button';

export default function AreasPage() {
  return (
    <div className='flex flex-col border rounded-2xl h-full overflow-hidden pr-2 bg-white'>
      <div className='flex flex-col overflow-y-auto pl-4 pr-2 py-4 gap-y-2'>
        <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
          <div className='flex flex-col'>
            <h1 className='text-3xl font-bold tracking-tight'>Области</h1>
            <p className='text-muted-foreground'>Управление географическими областями</p>
          </div>
          <CreateAreaButton />
        </div>
        <AreasTable />
      </div>
    </div>
  );
}
