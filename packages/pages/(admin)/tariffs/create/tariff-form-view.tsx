import { FormProvider, type UseFormReturn } from 'react-hook-form';
import { Button } from '@shared/ui/forms/button';
import { Card, CardContent } from '@shared/ui/layout';
import { ChapterHeader } from '@shared/ui/layout/chapter-header';
import { FormSidebar } from '@shared/ui/layout/form-sidebar';
import { TariffBasicSection, TariffPricingSection } from '@entities/tariffs';
import { TARIFF_FORM_CHAPTERS } from '@entities/tariffs/model/form-chapters/tariff-chapters';
import type { TariffCreateFormData } from '@entities/tariffs/schemas/tariffCreateSchema';
import type { TariffIconItem } from '@entities/tariffs/ui/tariff-basic-section';

interface TariffFormViewProps {
  form: UseFormReturn<TariffCreateFormData>;
  isSubmitting: boolean;
  getChapterStatus: (chapterId: string) => 'complete' | 'warning' | 'error' | 'pending';
  getChapterErrors: (chapterId: string) => string[];
  onCreate: () => void;
  handleChapterClick: (chapterId: string) => void;
  onBack: () => void;
  onIconChange: (item: TariffIconItem | null) => void;
}

export function TariffFormView({
  form,
  isSubmitting,
  getChapterStatus,
  getChapterErrors,
  onCreate,
  handleChapterClick,
  onBack,
  onIconChange,
}: TariffFormViewProps) {
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
                    <TariffBasicSection
                      showOptionalWarning={getChapterStatus('basic') === 'warning'}
                      labels={{
                        name: 'Название тарифа *',
                        serviceClass: 'Класс обслуживания *',
                        carType: 'Тип автомобиля *',
                      }}
                      placeholders={{
                        name: 'Введите название тарифа',
                      }}
                      onIconChange={onIconChange}
                    />
                  </div>
                </div>

                {/* Глава 2: Ценообразование */}
                <div id='chapter-pricing' className='relative flex flex-col gap-4'>
                  <ChapterHeader
                    number={2}
                    title='Ценообразование'
                    status={getChapterStatus('pricing')}
                  />
                  <div className='relative ml-12'>
                    {/* Вертикальная линия */}
                    <div className='absolute -left-8 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-300' />
                    <TariffPricingSection
                      labels={{
                        basePrice: 'Базовая цена (сом) *',
                        minutePrice: 'Цена за минуту (сом) *',
                        perKmPrice: 'Цена за километр (сом) *',
                        freeWaitingTimeMinutes: 'Бесплатное ожидание (минуты) *',
                      }}
                      placeholders={{
                        basePrice: '50.00',
                        minutePrice: '5.00',
                        perKmPrice: '15.00',
                        freeWaitingTimeMinutes: '5',
                      }}
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
            title='Создание тарифа'
            chapters={TARIFF_FORM_CHAPTERS.CREATE}
            getChapterStatus={getChapterStatus}
            getChapterErrors={getChapterErrors}
            onCreate={onCreate}
            isSubmitting={isSubmitting}
            onBack={onBack}
            onChapterClick={handleChapterClick}
          />
        </div>
      </div>
    </FormProvider>
  );
}
