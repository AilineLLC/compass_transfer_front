'use client';

import { notFound, useRouter } from 'next/navigation';
import { useState, useEffect, useLayoutEffect } from 'react';
import { FormProvider, type UseFormReturn } from 'react-hook-form';
import { usersApi } from '@shared/api/users';
import { Card, CardContent } from '@shared/ui/layout';
import { ChapterHeader } from '@shared/ui/layout/chapter-header';
import { FormSidebar } from '@shared/ui/layout/form-sidebar';
import { BasicDataSection, EmployeeProfileSection } from '@entities/users';
import type { GetOperatorDTO } from '@entities/users/interface';
import { OPERATOR_FORM_CHAPTERS } from '@entities/users/model/form-chapters/operator-chapters';
import type { OperatorUpdateFormData } from '@entities/users/schemas/operatorUpdateSchema';
import { useOperatorEditFormLogic } from '@features/users/forms/edit/operator-edit-form';

interface OperatorEditViewProps {
  userId: string;
}

interface OperatorEditFormViewProps {
  form: UseFormReturn<OperatorUpdateFormData>;
  isSubmitting: boolean;
  getChapterStatus: (chapterId: string) => 'complete' | 'warning' | 'error' | 'pending';
  getChapterErrors: (chapterId: string) => string[];
  onUpdate: () => void;
  handleChapterClick: (chapterId: string) => void;
  onBack: () => void;
}

export function OperatorEditView({ userId }: OperatorEditViewProps) {
  const router = useRouter();
  const [operator, setOperator] = useState<GetOperatorDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загружаем данные оператора
  useEffect(() => {
    const loadOperator = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const userData = await usersApi.getOperator(userId);

        setOperator(userData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      loadOperator();
    }
  }, [userId]);

  // Всегда вызываем хук, но с условными данными
  const logic = useOperatorEditFormLogic({
    operatorId: userId,
    initialData: {
      fullName: '',
      phoneNumber: '',
      avatarUrl: null,
      isActive: true,
      isMainSupportOperator: false,
      profile: {
        employeeId: '',
        department: '',
        position: '',
        hireDate: '',
      },
    },
    onBack: () => router.push(`/users/operator/${userId}`),
    onSuccess: () => router.push(`/users/operator/${userId}`),
  });

  // Заполняем форму через useLayoutEffect с reset()
  useLayoutEffect(() => {
    if (operator && logic.form) {
      // Заполняем только поля, которые есть в схеме OperatorUpdateFormData
      logic.form.reset({
        fullName: operator.fullName || '',
        phoneNumber: operator.phoneNumber || '',
        avatarUrl: operator.avatarUrl || null,
        isActive: operator.isActive ?? true,
        isMainSupportOperator: operator.isMainSupportOperator ?? false,
        profile: {
          employeeId: operator.profile?.employeeId || '',
          department: operator.profile?.department || '',
          position: operator.profile?.position || '',
          hireDate: operator.profile?.hireDate || '',
        },
      });
    }
  }, [operator, logic.form]);

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4' />
          <p>Загрузка данных оператора...</p>
        </div>
      </div>
    );
  }

  if (error || !operator) {
    notFound();
  }

  return <OperatorEditFormView {...logic} />;
}

function OperatorEditFormView({
  form,
  isSubmitting,
  getChapterStatus,
  getChapterErrors,
  onUpdate,
  handleChapterClick,
  onBack,
}: OperatorEditFormViewProps) {
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
                      labels={{
                        fullName: 'Полное имя *',
                        email: 'Email *',
                        phoneNumber: 'Телефон',
                      }}
                    />
                  </div>
                </div>

                {/* Глава 2: Профиль сотрудника */}
                <div id='chapter-employee-profile' className='relative flex flex-col gap-4'>
                  <ChapterHeader
                    number={2}
                    title='Профиль сотрудника'
                    status={getChapterStatus('employee-profile')}
                  />
                  <div className='relative ml-12'>
                    {/* Вертикальная линия */}
                    <div className='absolute -left-8 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-300' />
                    <EmployeeProfileSection
                      showOptionalWarning={getChapterStatus('employee-profile') === 'warning'}
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
            chapters={OPERATOR_FORM_CHAPTERS.EDIT}
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
