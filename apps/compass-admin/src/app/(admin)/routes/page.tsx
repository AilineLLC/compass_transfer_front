import { RoutesTable } from '@features/routes';
import { CreateRouteButton } from './create-route-button';

export default function RoutesPage() {
  return (
    <div className='flex flex-col border rounded-2xl h-full overflow-hidden pr-2 bg-white'>
      <div className='flex flex-col overflow-y-auto pl-4 pr-2 py-4'>
        <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
          <div className='flex flex-col'>
            <h1 className='text-3xl font-bold tracking-tight'>Направления</h1>
            <p className='text-muted-foreground'>Управление маршрутами системы</p>
          </div>

          <CreateRouteButton />
        </div>

        <RoutesTable />
      </div>
    </div>
  );
}
