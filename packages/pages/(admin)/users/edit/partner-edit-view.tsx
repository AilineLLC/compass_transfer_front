'use client';

import { notFound, useRouter } from 'next/navigation';
import { useState, useEffect, useLayoutEffect } from 'react';
import { FormProvider, type UseFormReturn } from 'react-hook-form';
import { usersApi } from '@shared/api/users';
import { Card, CardContent } from '@shared/ui/layout';
import { ChapterHeader } from '@shared/ui/layout/chapter-header';
import { FormSidebar } from '@shared/ui/layout/form-sidebar';
import { BasicDataSection, CompanyDataSection, PartnerSaleSection, PartnerDocumentsSection } from '@entities/users';
import type { PartnerDocumentItem } from '@entities/users';
import { BusinessType, VerificationStatus } from '@entities/users/enums';
import type { GetPartnerDTO } from '@entities/users/interface';
import { PARTNER_FORM_CHAPTERS } from '@entities/users/model/form-chapters/partner-chapters';
import type { PartnerUpdateFormData } from '@entities/users/schemas/partnerUpdateSchema';
import { usePartnerEditFormLogic } from '@features/users/forms/edit/partner-edit-form';

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

interface PartnerEditViewProps {
  userId: string;
}

interface PartnerEditFormViewProps {
  form: UseFormReturn<PartnerUpdateFormData>;
  isSubmitting: boolean;
  getChapterStatus: (chapterId: string) => 'complete' | 'warning' | 'error' | 'pending';
  getChapterErrors: (chapterId: string) => string[];
  onUpdate: () => void;
  handleChapterClick: (chapterId: string) => void;
  onBack: () => void;
  onDocumentItemsChange: (items: PartnerDocumentItem[]) => void;
  existingDocumentIds: string[];
}

export function PartnerEditView({ userId }: PartnerEditViewProps) {
  const router = useRouter();
  const [partner, setPartner] = useState<GetPartnerDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загружаем данные партнера
  useEffect(() => {
    const loadPartner = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const userData = await usersApi.getPartner(userId);

        setPartner(userData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      loadPartner();
    }
  }, [userId]);

  // Всегда вызываем хук, но с условными данными
  const logic = usePartnerEditFormLogic({
    partnerId: userId,
    initialData: {
      fullName: '',
      phoneNumber: '',
      avatarUrl: null,
      verificationStatus: VerificationStatus.Pending,
      profile: {
        companyName: '',
        companyType: BusinessType.Individual,
        registrationNumber: null,
        taxIdentifier: null,
        legalAddress: '',
        contactEmail: null,
        contactPhone: null,
        website: null,
      },
      sale: null,
    },
    onBack: () => router.push(`/users/partner/${userId}`),
    onSuccess: () => router.push(`/users/partner/${userId}`),
  });

  // Заполняем форму через useLayoutEffect с reset()
  useLayoutEffect(() => {
    if (partner && logic.form) {
      // Заполняем только поля, которые есть в схеме PartnerUpdateFormData
      logic.form.reset({
        fullName: partner.fullName || '',
        phoneNumber: partner.phoneNumber || '',
        avatarUrl: partner.avatarUrl || null,
        verificationStatus: partner.verificationStatus || VerificationStatus.Pending,
        profile: {
          companyName: partner.profile?.companyName || '',
          companyType: partner.profile?.companyType || BusinessType.Individual,
          registrationNumber: partner.profile?.registrationNumber || null,
          taxIdentifier: partner.profile?.taxIdentifier || null,
          legalAddress: partner.profile?.legalAddress || '',
          contactEmail: partner.profile?.contactEmail || null,
          contactPhone: partner.profile?.contactPhone || null,
          website: partner.profile?.website || null,
        },
        sale: partner.sale,
      });
    }
  }, [partner, logic.form]);

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4' />
          <p>Загрузка данных партнера...</p>
        </div>
      </div>
    );
  }

  if (error || !partner) {
    notFound();
  }

  return (
    <PartnerEditFormView
      {...logic}
      existingDocumentIds={partner?.profile?.documents ?? []}
    />
  );
}

function PartnerEditFormView({
  form,
  isSubmitting,
  getChapterStatus,
  getChapterErrors,
  onUpdate,
  handleChapterClick,
  onBack,
  onDocumentItemsChange,
  existingDocumentIds,
}: PartnerEditFormViewProps) {
  return (
    <FormProvider {...form}>
      <div className='flex overflow-hidden h-full pb-2'>
        <div className='shadow-md flex-1 h-full p-4 overflow-auto border bg-white rounded-2xl md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-[0_10px_40px_rgba(255,255,255,0.3)]'>
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
                    {/* Вертикальная линия */}
                    <div className='absolute -left-8 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-300' />
                    <BasicDataSection
                      showOptionalPhoneWarning={getChapterStatus('basic') === 'warning'}
                      showEmail={false}
                      labels={{
                        fullName: 'Полное имя *',
                        phoneNumber: 'Телефон',
                      }}
                    />
                  </div>
                </div>

                {/* Глава 2: Данные компании */}
                <div id='chapter-business' className='relative flex flex-col gap-4'>
                  <ChapterHeader
                    number={2}
                    title='Данные компании'
                    status={getChapterStatus('business')}
                  />
                  <div className='relative ml-12'>
                    {/* Вертикальная линия */}
                    <div className='absolute -left-8 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-300' />
                    <CompanyDataSection companyTypeOptions={COMPANY_TYPE_OPTIONS} />
                  </div>
                </div>

                {/* Глава 3: Условия сотрудничества */}
                <div id='chapter-sale' className='relative flex flex-col gap-4'>
                  <ChapterHeader
                    number={3}
                    title='Условия сотрудничества'
                    status={getChapterStatus('sale')}
                  />
                  <div className='relative ml-12'>
                    {/* Вертикальная линия */}
                    <div className='absolute -left-8 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-300' />
                    <PartnerSaleSection />
                  </div>
                </div>

                {/* Глава 4: Документы */}
                <div id='chapter-documents' className='relative flex flex-col gap-4'>
                  <ChapterHeader
                    number={4}
                    title='Документы'
                    status={getChapterStatus('documents')}
                  />
                  <div className='relative ml-12'>
                    {/* Вертикальная линия */}
                    <div className='absolute -left-8 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-300' />
                    <PartnerDocumentsSection
                      existingDocumentIds={existingDocumentIds}
                      onItemsChange={onDocumentItemsChange}
                    />
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className='w-80 flex-shrink-0 flex flex-col h-full'>
          {/* Сайдбар */}
          <FormSidebar
            chapters={PARTNER_FORM_CHAPTERS.EDIT}
            getChapterStatus={getChapterStatus}
            getChapterErrors={getChapterErrors}
            onChapterClick={handleChapterClick}
            onUpdate={onUpdate}
            isSubmitting={isSubmitting}
            onBack={onBack}
          />
        </div>
      </div>
    </FormProvider>
  );
}
