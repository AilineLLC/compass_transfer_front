import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@shared/ui/forms/button';
import { Card, CardContent } from '@shared/ui/layout';

interface NotificationViewErrorProps {
  error: string;
  onBack: () => void;
  onRetry?: () => void;
}

export function NotificationViewError({ error, onBack, onRetry }: NotificationViewErrorProps) {
  return (
    <div className='pr-2 border rounded-2xl overflow-hidden shadow-sm h-full bg-white flex flex-col gap-6 p-6'>
      <Card>
        <CardContent className='p-6'>
          <div className='flex flex-col items-center justify-center text-center space-y-4'>
            <div className='w-16 h-16 rounded-full bg-red-100 flex items-center justify-center'>
              <AlertCircle className='h-8 w-8 text-red-600' />
            </div>
            <div>
              <h2 className='text-xl font-semibold text-gray-900 mb-2'>Ошибка загрузки</h2>
              <p className='text-gray-600'>{error}</p>
            </div>
            <div className='flex gap-3'>
              <Button variant='outline' onClick={onBack}>
                <ArrowLeft className='mr-2 h-4 w-4' />
                Назад к списку
              </Button>
              {onRetry && (
                <Button onClick={onRetry}>
                  Повторить попытку
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
