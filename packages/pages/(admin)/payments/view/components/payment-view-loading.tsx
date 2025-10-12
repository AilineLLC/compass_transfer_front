import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@shared/ui/layout';
import { Skeleton } from '@shared/ui/data-display/skeleton';

export function PaymentViewLoading() {
  return (
    <div className='pr-2 border rounded-2xl overflow-hidden shadow-sm h-full bg-white flex flex-col gap-6 p-6'>
      {/* Заголовок */}
      <Card>
        <CardContent className='p-6'>
          <div className='flex items-start gap-4'>
            <Skeleton className='w-16 h-16 rounded-full' />
            <div className='flex-1 space-y-2'>
              <Skeleton className='h-8 w-64' />
              <Skeleton className='h-4 w-48' />
              <Skeleton className='h-4 w-32' />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Контент */}
      <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
        <div className='lg:col-span-3 space-y-6'>
          <Card>
            <CardContent className='p-6 space-y-4'>
              <Skeleton className='h-6 w-48' />
              <div className='grid grid-cols-2 gap-4'>
                <Skeleton className='h-20' />
                <Skeleton className='h-20' />
                <Skeleton className='h-20' />
                <Skeleton className='h-20' />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className='lg:col-span-1'>
          <Card>
            <CardContent className='p-6 space-y-3'>
              <Skeleton className='h-10 w-full' />
              <Skeleton className='h-10 w-full' />
              <Skeleton className='h-10 w-full' />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Индикатор загрузки */}
      <div className='absolute inset-0 flex items-center justify-center bg-white/50'>
        <Loader2 className='h-8 w-8 animate-spin text-gray-400' />
      </div>
    </div>
  );
}
