'use client';

import { notFound, useRouter } from 'next/navigation';
import { useState, useEffect, useLayoutEffect } from 'react';
import { FormProvider, type UseFormReturn } from 'react-hook-form';
import { usersApi } from '@shared/api/users';
import { Card, CardContent } from '@shared/ui/layout';
import { ChapterHeader } from '@shared/ui/layout/chapter-header';
import { FormSidebar } from '@shared/ui/layout/form-sidebar';
import {
  BasicDataSection,
  DriverLicenseSection,
  PersonalInfoSection,
  PassportDataSection,
  EmploymentSection,
  RidePreferencesSection,
  ProfileExtrasSection,
  WorkExperienceSection,
  EducationSection,
  TestScoreSection,
} from '@entities/users';
import { VerificationStatus, CitizenshipCountry, IdentityDocumentType, EmploymentType, type ServiceClass } from '@entities/users/enums';
import type { GetDriverDTO, Employment } from '@entities/users/interface';
import { DRIVER_FORM_CHAPTERS } from '@entities/users/model/form-chapters/driver-chapters';
import type { DriverUpdateFormData } from '@entities/users/schemas/driverUpdateSchema';
import { useDriverEditFormLogic } from '@features/users/forms/edit/driver-edit-form';

// Расширенный интерфейс для GetDriverDTO с employment
interface GetDriverDTOWithEmployment extends GetDriverDTO {
  employment?: Employment;
}

interface DriverEditViewProps {
  userId: string;
}

interface DriverEditFormViewProps {
  form: UseFormReturn<DriverUpdateFormData>;
  isSubmitting: boolean;
  getChapterStatus: (chapterId: string) => 'complete' | 'warning' | 'error' | 'pending';
  getChapterErrors: (chapterId: string) => string[];
  onUpdate: () => void;
  handleChapterClick: (chapterId: string) => void;
  onBack: () => void;
}

export function DriverEditView({ userId }: DriverEditViewProps) {
  const router = useRouter();
  const [driver, setDriver] = useState<GetDriverDTOWithEmployment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загружаем данные водителя
  useEffect(() => {
    const loadDriver = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const userData: GetDriverDTOWithEmployment = await usersApi.getDriver(userId);

        setDriver(userData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      loadDriver();
    }
  }, [userId]);

  // Всегда вызываем хук с пустыми данными
  const logic = useDriverEditFormLogic({
    driverId: userId,
    initialData: {
      fullName: '',
      email: '',
      phoneNumber: '',
      avatarUrl: null,
      verificationStatus: VerificationStatus.Pending,
      profile: {
        licenseNumber: '',
        licenseCategories: [],
        licenseIssueDate: '',
        licenseExpiryDate: '',
        dateOfBirth: '',
        birthPlace: null,
        citizenship: '',
        citizenshipCountry: CitizenshipCountry.KG,
        drivingExperience: null,
        languages: [],
        taxIdentifier: null,
        totalRides: 0,
        totalDistance: 0,
        lastRideDate: null,
        medicalExamDate: null,
        backgroundCheckDate: null,
        profilePhoto: null,
        preferredRideTypes: [] as ServiceClass[],
        preferredWorkZones: [],
        trainingCompleted: false,
        passport: {
          number: '',
          series: null,
          issueDate: null,
          issuedBy: null,
          page: null,
          expiryDate: null,
          identityType: IdentityDocumentType.IdCard,
        },
        workExperience: [],
        education: [],
        testScore: [],
      },
      employment: {
        companyName: '',
        employmentType: EmploymentType.FixedAmount,
        fixedAmount: null,
        percentage: null,
      },
    },
    onBack: () => router.push(`/users/driver/${userId}`),
    onSuccess: () => router.push(`/users/driver/${userId}`),
  });

  // Заполняем форму через useLayoutEffect с reset()
  useLayoutEffect(() => {
    if (driver && logic.form) {
      const resetData = {
        fullName: driver.fullName || '',
        phoneNumber: driver.phoneNumber || '',
        avatarUrl: driver.avatarUrl || null,
        verificationStatus: driver.verificationStatus,
        profile: {
          licenseNumber: driver.profile?.licenseNumber || '',
          licenseCategories: driver.profile?.licenseCategories || [],
          licenseIssueDate: driver.profile?.licenseIssueDate || '',
          licenseExpiryDate: driver.profile?.licenseExpiryDate || '',
          dateOfBirth: driver.profile?.dateOfBirth || '',
          birthPlace: driver.profile?.birthPlace || null,
          citizenship: driver.profile?.citizenship || '',
          citizenshipCountry: driver.profile?.citizenshipCountry,
          drivingExperience: driver.profile?.drivingExperience || null,
          languages: driver.profile?.languages || [],
          taxIdentifier: driver.profile?.taxIdentifier || null,
          totalRides: driver.profile?.totalRides || 0,
          totalDistance: driver.profile?.totalDistance || 0,
          lastRideDate: driver.profile?.lastRideDate || null,
          medicalExamDate: driver.profile?.medicalExamDate || null,
          backgroundCheckDate: driver.profile?.backgroundCheckDate || null,
          profilePhoto: driver.profile?.profilePhoto || null,
          preferredRideTypes: driver.profile?.preferredRideTypes as ServiceClass[] || [],
          preferredWorkZones: driver.profile?.preferredWorkZones || [],
          trainingCompleted: driver.profile?.trainingCompleted || false,
          passport: {
            number: driver.profile?.passport?.number || '',
            series: driver.profile?.passport?.series || null,
            issueDate: driver.profile?.passport?.issueDate || null,
            issuedBy: driver.profile?.passport?.issuedBy || null,
            page: driver.profile?.passport?.page || null,
            expiryDate: driver.profile?.passport?.expiryDate || null,
            identityType: driver.profile?.passport?.identityType,
          },
          workExperience: driver.profile?.workExperience || [],
          education: driver.profile?.education || [],
          testScore: driver.profile?.testScore || [],
        },
        employment: {
          companyName: driver.employment?.companyName || '',
          employmentType: driver.employment?.employmentType,
          fixedAmount: driver.employment?.fixedAmount || null,
          percentage: driver.employment?.percentage || null,
        },
      };

      logic.form.reset(resetData);
    }
  }, [driver, logic.form]);

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4' />
          <p>Загрузка данных водителя...</p>
        </div>
      </div>
    );
  }

  if (error || !driver) {
    notFound();
  }

  return <DriverEditFormView {...logic} />;
}

function DriverEditFormView({
  form,
  isSubmitting,
  getChapterStatus,
  getChapterErrors,
  onUpdate,
  handleChapterClick,
  onBack,
}: DriverEditFormViewProps) {
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
                      showVerificationStatus
                      labels={{
                        fullName: 'Полное имя *',
                        phoneNumber: 'Телефон',
                      }}
                    />
                  </div>
                </div>

                {/* Глава 2: Водительские права */}
                <div id='chapter-driver-license' className='relative flex flex-col gap-4'>
                  <ChapterHeader
                    number={2}
                    title='Водительские права'
                    status={getChapterStatus('driver-license')}
                  />
                  <div className='relative ml-12'>
                    {/* Вертикальная линия */}
                    <div className='absolute -left-8 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-300' />
                    <DriverLicenseSection />
                  </div>
                </div>

                {/* Глава 3: Личная информация */}
                <div id='chapter-personal-info' className='relative flex flex-col gap-4'>
                  <ChapterHeader
                    number={3}
                    title='Личная информация'
                    status={getChapterStatus('personal-info')}
                  />
                  <div className='relative ml-12'>
                    {/* Вертикальная линия */}
                    <div className='absolute -left-8 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-300' />
                    <PersonalInfoSection />
                  </div>
                </div>

                {/* Глава 4: Паспортные данные */}
                <div id='chapter-passport-data' className='relative flex flex-col gap-4'>
                  <ChapterHeader
                    number={4}
                    title='Паспортные данные'
                    status={getChapterStatus('passport-data')}
                  />
                  <div className='relative ml-12'>
                    {/* Вертикальная линия */}
                    <div className='absolute -left-8 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-300' />
                    <PassportDataSection />
                  </div>
                </div>

                {/* Глава 5: Трудоустройство */}
                <div id='chapter-employment' className='relative flex flex-col gap-4'>
                  <ChapterHeader
                    number={5}
                    title='Трудоустройство'
                    status={getChapterStatus('employment')}
                  />
                  <div className='relative ml-12'>
                    {/* Вертикальная линия */}
                    <div className='absolute -left-8 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-300' />
                    <EmploymentSection />
                  </div>
                </div>

                {/* Глава 6: Предпочтения поездок */}
                <div id='chapter-ride-preferences' className='relative flex flex-col gap-4'>
                  <ChapterHeader
                    number={6}
                    title='Предпочтения поездок'
                    status={getChapterStatus('ride-preferences')}
                  />
                  <div className='relative ml-12'>
                    <RidePreferencesSection />
                  </div>
                </div>

                {/* Глава 7: Дополнительная информация */}
                <div id='chapter-additional' className='relative flex flex-col gap-4'>
                  <ChapterHeader
                    number={7}
                    title='Дополнительная информация'
                    status={getChapterStatus('additional')}
                  />
                  <div className='relative ml-12'>
                    <div className='absolute -left-8 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-300' />
                    <ProfileExtrasSection />
                  </div>
                </div>

                {/* Глава 8: Опыт работы */}
                <div id='chapter-work-experience' className='relative flex flex-col gap-4'>
                  <ChapterHeader
                    number={8}
                    title='Опыт работы'
                    status={getChapterStatus('work-experience')}
                  />
                  <div className='relative ml-12'>
                    <div className='absolute -left-8 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-300' />
                    <WorkExperienceSection />
                  </div>
                </div>

                {/* Глава 9: Образование */}
                <div id='chapter-education' className='relative flex flex-col gap-4'>
                  <ChapterHeader
                    number={9}
                    title='Образование'
                    status={getChapterStatus('education')}
                  />
                  <div className='relative ml-12'>
                    <div className='absolute -left-8 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-300' />
                    <EducationSection />
                  </div>
                </div>

                {/* Глава 10: Тесты */}
                <div id='chapter-tests' className='relative flex flex-col gap-4'>
                  <ChapterHeader
                    number={10}
                    title='Тесты'
                    status={getChapterStatus('tests')}
                  />
                  <div className='relative ml-12'>
                    <div className='absolute -left-8 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-300' />
                    <TestScoreSection />
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className='w-80 flex-shrink-0 flex flex-col h-full'>
          {/* Сайдбар */}
          <FormSidebar
            chapters={DRIVER_FORM_CHAPTERS.EDIT}
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
