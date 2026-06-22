import { FormProvider, type UseFormReturn } from 'react-hook-form';
import { Button } from '@shared/ui/forms/button';
import { Card, CardContent, ChapterHeader } from '@shared/ui/layout';
import { FormSidebar } from '@shared/ui/layout/form-sidebar';
import { BasicDataSection, CompanyDataSection, SecuritySection, PartnerSaleSection, PartnerDocumentsSection } from '@entities/users';
import type { PartnerDocumentItem } from '@entities/users';
import { BusinessType } from '@entities/users/enums';
import { PARTNER_FORM_CHAPTERS } from '@entities/users/model/form-chapters/partner-chapters';
import type { PartnerCreateFormData } from '@entities/users/schemas/partnerCreateSchema';

// Опции для типов компаний
const COMPANY_TYPE_OPTIONS = [
  { value: BusinessType.Individual, label: 'Индивидуальный предприниматель' },
  { value: BusinessType.LLC, label: 'ООО' },
  { value: BusinessType.Corporation, label: 'Корпорация' },
  { value: BusinessType.Partnership, label: 'Товарищество' },
  { value: BusinessType.Cooperative, label: 'Кооператив' },
  { value: BusinessType.NonProfit, label: 'Некоммерческая организация' },
  { value: BusinessType.GovernmentEntity, label: 'Государственная организация' },
] as const;

interface PartnerFormViewProps {
  form: UseFormReturn<any>;
  isSubmitting: boolean;
  getChapterStatus: (chapterId: string) => 'complete' | 'warning' | 'error' | 'pending';
  getChapterErrors: (chapterId: string) => string[];
  onCreate: () => void;
  handleChapterClick: (chapterId: string) => void;
  onBack: () => void;
  selectedRole: string;
  onDocumentItemsChange: (items: PartnerDocumentItem[]) => void;
}

export function PartnerFormView({
  form,
  isSubmitting,
  getChapterStatus,
  getChapterErrors,
  onCreate,
  handleChapterClick,
  onBack,
  onDocumentItemsChange,
}: PartnerFormViewProps) {
  return (
    <FormProvider {...form}>
      <div className='flex overflow-hidden h-full'>
        <div className='flex-1 h-full p-4 overflow-auto border bg-white rounded-2xl md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-[0_10px_40px_rgba(255,255,255,0.3)]'>
          <Card className='h-full flex flex-col overflow-auto pr-4'>
            <CardContent className='p-0'>
              <form className='flex flex-col gap-4'>
                {/* Глава 1: Базовые данные */}
                <div id='chapter-basic' className='relative flex flex-col gap-4'>
                  <ChapterHeader
                    number={1}
                    title='Базовые данные'
                    status={getChapterStatus('basic')}
                  />
                  <div className='relative ml-12'>
                    <div className='absolute -left-8 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-300' />
                    <BasicDataSection
                      showOptionalPhoneWarning={getChapterStatus('basic') === 'warning'}
                    />
                  </div>
                </div>

                {/* Глава 2: Данные компании */}
                <div id='chapter-company' className='relative flex flex-col gap-4'>
                  <ChapterHeader
                    number={2}
                    title='Данные компании'
                    status={getChapterStatus('business')}
                  />
                  <div className='relative ml-12'>
                    <div className='absolute -left-8 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-300' />
                    <CompanyDataSection companyTypeOptions={COMPANY_TYPE_OPTIONS} />
                  </div>
                </div>

                {/* Глава 3: Безопасность */}
                <div id='chapter-security' className='relative flex flex-col gap-4'>
                  <ChapterHeader
                    number={3}
                    title='Безопасность'
                    status={getChapterStatus('security')}
                  />
                  <div className='relative ml-12'>
                    <div className='absolute -left-8 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-300' />
                    <SecuritySection />
                  </div>
                </div>

                {/* Глава 4: Условия сотрудничества */}
                <div id='chapter-sale' className='relative flex flex-col gap-4'>
                  <ChapterHeader
                    number={4}
                    title='Условия сотрудничества'
                    status={getChapterStatus('sale')}
                  />
                  <div className='relative ml-12'>
                    <div className='absolute -left-8 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-300' />
                    <PartnerSaleSection />
                  </div>
                </div>

                {/* Глава 5: Документы */}
                <div id='chapter-documents' className='relative flex flex-col gap-4'>
                  <ChapterHeader
                    number={5}
                    title='Документы'
                    status={getChapterStatus('documents')}
                  />
                  <div className='relative ml-12'>
                    <div className='absolute -left-8 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-300' />
                    <PartnerDocumentsSection onItemsChange={onDocumentItemsChange} />
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
            title='Создание партнера'
            chapters={PARTNER_FORM_CHAPTERS.CREATE}
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
