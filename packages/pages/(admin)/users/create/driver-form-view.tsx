'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { FormProvider, type UseFormReturn } from 'react-hook-form';
import { Button } from '@shared/ui/forms/button';
import { Card, CardContent, ChapterHeader } from '@shared/ui/layout';
import { FormSidebar } from '@shared/ui/layout/form-sidebar';
import {
  BasicDataSection,
  SecuritySection,
  DriverLicenseSection,
  PersonalInfoSection,
  PassportDataSection,
  EmploymentSection,
  RidePreferencesSection,
  ProfileExtrasSection,
  WorkExperienceSection,
  EducationSection,
  DRIVER_FORM_CHAPTERS,
} from '@entities/users';
import type { DriverCreateFormData } from '@entities/users/schemas/driverCreateSchema';

interface DriverFormViewProps {
  form: UseFormReturn<DriverCreateFormData>;
  isSubmitting: boolean;
  getChapterStatus: (chapterId: string) => 'complete' | 'warning' | 'error' | 'pending';
  getChapterErrors: (chapterId: string) => string[];
  onCreate: () => void;
  handleChapterClick: (chapterId: string) => void;
  onBack: () => void;
  selectedRole: string;
}

export function DriverFormView({
  form,
  isSubmitting,
  getChapterStatus,
  getChapterErrors,
  onCreate,
  handleChapterClick,
  onBack,
}: DriverFormViewProps) {
  const [showOptional, setShowOptional] = useState(false);

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
                      showVerificationStatus
                    />
                  </div>
                </div>

                {/* Глава 2: Безопасность */}
                <div id='chapter-security' className='relative flex flex-col gap-4'>
                  <ChapterHeader
                    number={2}
                    title='Безопасность'
                    status={getChapterStatus('security')}
                  />
                  <div className='relative ml-12'>
                    <div className='absolute -left-8 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-300' />
                    <SecuritySection />
                  </div>
                </div>

                {/* Глава 3: Трудоустройство */}
                <div id='chapter-employment' className='relative flex flex-col gap-4'>
                  <ChapterHeader
                    number={3}
                    title='Трудоустройство'
                    status={getChapterStatus('employment')}
                  />
                  <div className='relative ml-12'>
                    <div className='absolute -left-8 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-300' />
                    <EmploymentSection />
                  </div>
                </div>

                {/* Глава 4: Предпочтения поездок */}
                <div id='chapter-ride-preferences' className='relative flex flex-col gap-4'>
                  <ChapterHeader
                    number={4}
                    title='Предпочтения поездок'
                    status={getChapterStatus('ride-preferences')}
                  />
                  <div className='relative ml-12'>
                    <div className='absolute -left-8 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-300' />
                    <RidePreferencesSection />
                  </div>
                </div>

                {/* Кнопка раскрытия необязательных разделов */}
                <div className='flex justify-center py-2'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => setShowOptional(v => !v)}
                    className='gap-2 focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md focus:shadow-md focus-visible:shadow-md transition-shadow'
                  >
                    {showOptional ? (
                      <>
                        <ChevronUp className='h-4 w-4' />
                        Скрыть необязательные поля
                      </>
                    ) : (
                      <>
                        <ChevronDown className='h-4 w-4' />
                        Заполнить необязательные поля
                      </>
                    )}
                  </Button>
                </div>

                {/* Необязательные разделы */}
                {showOptional && (
                  <>
                    {/* Глава 5: Водительское удостоверение */}
                    <div id='chapter-driver-license' className='relative flex flex-col gap-4'>
                      <ChapterHeader
                        number={5}
                        title='Водительское удостоверение'
                        status={getChapterStatus('driver-license')}
                      />
                      <div className='relative ml-12'>
                        <div className='absolute -left-8 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-300' />
                        <DriverLicenseSection />
                      </div>
                    </div>

                    {/* Глава 6: Личная информация */}
                    <div id='chapter-personal-info' className='relative flex flex-col gap-4'>
                      <ChapterHeader
                        number={6}
                        title='Личная информация'
                        status={getChapterStatus('personal-info')}
                      />
                      <div className='relative ml-12'>
                        <div className='absolute -left-8 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-300' />
                        <PersonalInfoSection />
                      </div>
                    </div>

                    {/* Глава 7: Паспортные данные */}
                    <div id='chapter-passport-data' className='relative flex flex-col gap-4'>
                      <ChapterHeader
                        number={7}
                        title='Паспортные данные'
                        status={getChapterStatus('passport-data')}
                      />
                      <div className='relative ml-12'>
                        <div className='absolute -left-8 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-300' />
                        <PassportDataSection />
                      </div>
                    </div>

                    {/* Глава 8: Дополнительная информация */}
                    <div id='chapter-additional' className='relative flex flex-col gap-4'>
                      <ChapterHeader
                        number={8}
                        title='Дополнительная информация'
                        status={getChapterStatus('additional')}
                      />
                      <div className='relative ml-12'>
                        <div className='absolute -left-8 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-300' />
                        <ProfileExtrasSection />
                      </div>
                    </div>

                    {/* Глава 9: Опыт работы */}
                    <div id='chapter-work-experience' className='relative flex flex-col gap-4'>
                      <ChapterHeader
                        number={9}
                        title='Опыт работы'
                        status={getChapterStatus('work-experience')}
                      />
                      <div className='relative ml-12'>
                        <div className='absolute -left-8 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-300' />
                        <WorkExperienceSection />
                      </div>
                    </div>

                    {/* Глава 10: Образование */}
                    <div id='chapter-education' className='relative flex flex-col gap-4'>
                      <ChapterHeader
                        number={10}
                        title='Образование'
                        status={getChapterStatus('education')}
                      />
                      <div className='relative ml-12'>
                        <div className='absolute -left-8 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-300' />
                        <EducationSection />
                      </div>
                    </div>
                  </>
                )}

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
            title='Создание водителя'
            chapters={DRIVER_FORM_CHAPTERS.CREATE}
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
