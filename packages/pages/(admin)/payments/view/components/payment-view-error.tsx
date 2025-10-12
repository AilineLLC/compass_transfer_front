import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@shared/ui/forms/button';
import { Card, CardContent } from '@shared/ui/layout';

interface PaymentViewErrorProps {
  error: string;
  onRetry?: () => void;
  onBack: () => void;
}

export function PaymentViewError({ error, onRetry, onBack }: PaymentViewErrorProps) {
  return (
    <div className='pr-2 border rounded-2xl overflow-hidden shadow-sm h-full bg-white flex items-center justify-center p-6'>
      <Card className='max-w-md w-full'>
        <CardContent className='p-8'>
          <div className='flex flex-col items-center text-center space-y-6'>
            {/* Иконка ошибки */}
            <div className='w-16 h-16 rounded-full bg-red-100 flex items-center justify-center'>
              <AlertCircle className='h-8 w-8 text-red-600' />
            </div>

            {/* Сообщение об ошибке */}
            <div className='space-y-2'>
              <h2 className='text-2xl font-bold text-gray-900'>Ошибка загрузки</h2>
              <p className='text-gray-600'>{error}</p>
            </div>

            {/* Кнопки действий */}
            <div className='flex flex-col sm:flex-row gap-3 w-full'>
              <Button
                variant='outline'
                onClick={onBack}
                className='flex-1'
              >
                <ArrowLeft className='mr-2 h-4 w-4' />
                Назад к списку
              </Button>

              {onRetry && (
                <Button
                  variant='default'
                  onClick={onRetry}
                  className='flex-1'
                >
                  <RefreshCw className='mr-2 h-4 w-4' />
                  Повторить
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
