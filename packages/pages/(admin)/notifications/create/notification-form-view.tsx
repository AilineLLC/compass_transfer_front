import { FormProvider, type UseFormReturn } from 'react-hook-form';
import { Button } from '@shared/ui/forms/button';
import { Card, CardContent } from '@shared/ui/layout';
import { ChapterHeader } from '@shared/ui/layout/chapter-header';
import { FormSidebar } from '@shared/ui/layout/form-sidebar';
import { NotificationBasicSection, NotificationRelationsSection } from '@entities/notifications';
import { NOTIFICATION_FORM_CHAPTERS } from '@entities/notifications/model/form-chapters/notification-chapters';
import type { NotificationCreateFormData } from '@entities/notifications/schemas/notificationCreateSchema';

interface NotificationFormViewProps {
  form: UseFormReturn<NotificationCreateFormData>;
  isSubmitting: boolean;
  getChapterStatus: (chapterId: string) => 'complete' | 'warning' | 'error' | 'pending';
  getChapterErrors: (chapterId: string) => string[];
  onCreate: () => void;
  handleChapterClick: (chapterId: string) => void;
  onBack: () => void;
}

export function NotificationFormView({
  form,
  isSubmitting,
  getChapterStatus,
  getChapterErrors,
  onCreate,
  handleChapterClick,
  onBack,
}: NotificationFormViewProps) {
  return (
    <FormProvider {...form}>
      <div className='flex overflow-hidden h-full pb-2'>
        <div className='shadow-md flex-1 h-full p-4 overflow-auto border bg-white rounded-2xl md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-[0_10px_40px_rgba(255,255,255,0.3)]'>
          <Card className='h-full flex flex-col overflow-auto pr-4'>
            <CardContent className='p-0'>
              <form className='flex flex-col gap-4'>
                {/* Глава 1: Основная информация */}
                <div id='chapter-basic' className='relative flex flex-col gap-4'>
                  <ChapterHeader
                    number={1}
                    title='Основная информация'
                    status={getChapterStatus('basic')}
                  />
                  <div className='relative ml-12'>
                    {/* Вертикальная линия */}
                    <div className='absolute -left-8 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-300' />
                    <NotificationBasicSection
                      labels={{
                        type: 'Тип уведомления *',
                        title: 'Заголовок уведомления *',
                        content: 'Содержимое уведомления',
                        orderType: 'Тип заказа',
                      }}
                      placeholders={{
                        title: 'Введите заголовок уведомления',
                        content: 'Введите содержимое уведомления (необязательно)',
                      }}
                    />
                  </div>
                </div>

                {/* Глава 2: Связанные данные */}
                <div id='chapter-relations' className='relative flex flex-col gap-4'>
                  <ChapterHeader
                    number={2}
                    title='Связанные данные'
                    status={getChapterStatus('relations')}
                  />
                  <div className='relative ml-12'>
                    {/* Вертикальная линия */}
                    <div className='absolute -left-8 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-300' />
                    <NotificationRelationsSection
                      labels={{
                        orderId: 'ID заказа',
                        rideId: 'ID поездки',
                        userId: 'ID пользователя',
                      }}
                      placeholders={{
                        orderId: 'Введите UUID заказа (необязательно)',
                        rideId: 'Введите UUID поездки (необязательно)',
                        userId: 'Введите UUID пользователя (необязательно)',
                      }}
                      showIsRead={false}
                    />
                  </div>
                </div>

                <div className='flex justify-end space-x-4 pt-6'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={onBack}
                    disabled={isSubmitting}
                    className='focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md focus:shadow-md focus-visible:shadow-md transition-shadow'
                  >
                    Отмена
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
        <div className='w-80 flex-shrink-0 flex flex-col h-full'>
          <FormSidebar
            title='Создание уведомления'
            chapters={NOTIFICATION_FORM_CHAPTERS.CREATE}
            getChapterStatus={getChapterStatus}
            getChapterErrors={getChapterErrors}
            onCreate={onCreate}
            isSubmitting={isSubmitting}
            onBack={onBack}
            onChapterClick={handleChapterClick}
            createButtonText='Создать уведомление'
          />
        </div>
      </div>
    </FormProvider>
  );
}
