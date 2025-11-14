'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { AxiosError } from 'axios';
import { useState, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { usersApi } from '@shared/api/users';
import { logger } from '@shared/lib';
import {
  CitizenshipCountry,
  VerificationStatus,
  IdentityDocumentType,
  EmploymentType,
  ServiceClass,
} from '@entities/users/enums';
import type { CreateDriverDTO } from '@entities/users/interface/CreateDriverDTO';
import { getBasicDataStatus, getBasicDataErrors } from '@entities/users/model/validation/ui';
import {
  getDriverEmploymentStatus,
  getDriverEmploymentErrors,
} from '@entities/users/model/validation/ui/driver-employment';
import {
  getDriverLicenseStatus,
  getDriverLicenseErrors,
} from '@entities/users/model/validation/ui/driver-license';
import {
  getPassportDataStatus,
  getPassportDataErrors,
} from '@entities/users/model/validation/ui/passport-data';
import {
  getPersonalInfoStatus,
  getPersonalInfoErrors,
} from '@entities/users/model/validation/ui/personal-info';
import {
  getRidePreferencesStatus,
  getRidePreferencesErrors,
} from '@entities/users/model/validation/ui/ride-preferences';
import { getSecurityStatus, getSecurityErrors } from '@entities/users/model/validation/ui/security';
import {
  driverCreateSchema,
  type DriverCreateFormData,
} from '@entities/users/schemas/driverCreateSchema';

type ApiError = {
  detail?: string;
  errors?: Record<string, string[]>;
};

export function useDriverFormLogic({
  selectedRole,
  onBack,
  onSuccess,
}: {
  selectedRole: string;
  onBack: () => void;
  onSuccess: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(driverCreateSchema),
    mode: 'onSubmit',
    defaultValues: {
      phoneNumber: '',
      fullName: '',
      avatarUrl: null,
      verificationStatus: VerificationStatus.Pending,
      profile: {
        licenseNumber: '',
        licenseCategories: ['B'], // По умолчанию "Легковые автомобили"
        licenseIssueDate: '',
        licenseExpiryDate: '',
        dateOfBirth: '',
        birthPlace: null,
        citizenship: 'KG', // По умолчанию "Кыргызстан"
        citizenshipCountry: CitizenshipCountry.KG,
        drivingExperience: null,
        languages: ['kyrgyz'], // По умолчанию "Кыргызский"
        taxIdentifier: null,
        totalRides: 0,
        totalDistance: 0,
        lastRideDate: null,
        medicalExamDate: null,
        backgroundCheckDate: null,
        profilePhoto: null,
        preferredRideTypes: [ServiceClass.Economy], // По умолчанию "Эконом"
        preferredWorkZones: [],
        trainingCompleted: false,
        passport: {
          number: '',
          series: null,
          issueDate: null,
          issuedBy: null,
          page: null,
          expiryDate: null,
          identityType: IdentityDocumentType.NationalPassport,
        },
        workExperience: [],
        education: [],
        testScore: [],
      },
      employment: {
        companyName: 'Компасс трансфер', // По умолчанию
        employmentType: EmploymentType.FixedAmount, // По умолчанию фиксированная
        percentage: null,
        fixedAmount: null,
      },
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const {
    formState: { errors, isSubmitted },
    handleSubmit,
    watch,
    trigger,
    setFocus,
  } = form;

  const formData = watch();

  // Функция для очистки данных перед отправкой
  const cleanFormData = (data: DriverCreateFormData): DriverCreateFormData => {
    const cleaned = { ...data };

    // Очищаем пустые строки в массивах
    if (cleaned.profile.licenseCategories) {
      cleaned.profile.licenseCategories = cleaned.profile.licenseCategories.filter(cat => cat && cat.trim() !== '');
    }

    if (cleaned.profile.languages) {
      cleaned.profile.languages = cleaned.profile.languages.filter(lang => lang && lang.trim() !== '');
    }

    if (cleaned.profile.preferredRideTypes) {
      cleaned.profile.preferredRideTypes = cleaned.profile.preferredRideTypes.filter(type => type);
    }

    if (cleaned.profile.preferredWorkZones) {
      cleaned.profile.preferredWorkZones = cleaned.profile.preferredWorkZones.filter(zone => zone && zone.trim() !== '');
    }

    // Очищаем пустые объекты в массивах
    if (cleaned.profile.workExperience) {
      cleaned.profile.workExperience = cleaned.profile.workExperience.filter(exp =>
        exp.employerName && exp.employerName.trim() !== '' &&
        exp.position && exp.position.trim() !== ''
      );
    }

    if (cleaned.profile.education) {
      cleaned.profile.education = cleaned.profile.education.filter(edu =>
        edu.institution && edu.institution.trim() !== ''
      );
    }

    if (cleaned.profile.testScore) {
      cleaned.profile.testScore = cleaned.profile.testScore.filter(test =>
        test.testName && test.testName.trim() !== ''
      );
    }

    return cleaned;
  };

  const onSubmit = useCallback(
    async (data: DriverCreateFormData) => {
      console.log('=== onSubmit CALLED ===');
      setIsSubmitting(true);

      // Отладка: выводим данные формы
      console.log('=== FORM SUBMISSION DEBUG ===');
      console.log('Form data before validation:', JSON.stringify(data, null, 2));
      console.log('Form errors:', JSON.stringify(errors, null, 2));
      console.log('Form is valid:', Object.keys(errors).length === 0);

      try {
        // Очищаем данные от пустых значений
        const cleanedData = cleanFormData(data);

        console.log('Cleaned data:', JSON.stringify(cleanedData, null, 2));

        // Подготавливаем данные для API (исключаем confirmPassword)
        const { confirmPassword: _confirmPassword, ...formDataWithoutConfirm } = cleanedData;

        const apiData: CreateDriverDTO = {
          ...formDataWithoutConfirm,
          phoneNumber: data.phoneNumber || null,
          avatarUrl: data.avatarUrl || null,
          profile: {
            ...formDataWithoutConfirm.profile,
            citizenshipCountry: typeof formDataWithoutConfirm.profile.citizenshipCountry === 'string' 
              ? formDataWithoutConfirm.profile.citizenshipCountry as CitizenshipCountry
              : formDataWithoutConfirm.profile.citizenshipCountry,
          },
          employment: {
            ...formDataWithoutConfirm.employment,
            employmentType: formDataWithoutConfirm.employment.employmentType as EmploymentType,
          },
        };

        console.log('Data being sent to API:', JSON.stringify(apiData, null, 2));
        console.log('Required fields check:');
        console.log('- email:', apiData.email);
        console.log('- password:', apiData.password);
        console.log('- verificationStatus:', apiData.verificationStatus);
        console.log('- profile:', !!apiData.profile);
        console.log('- fullName:', apiData.fullName);
        console.log('- employment.employmentType:', apiData.employment.employmentType);
        const result = await usersApi.createDriver(apiData);

        if (result && result.fullName) {
          toast.success(`Водитель ${result.fullName} успешно создан!`);
        } else {
          toast.success('Водитель успешно создан!');
        }
        onSuccess();
      } catch (error) {
        logger.warn('Ошибка создания водителя:', error);
        if (error instanceof Error && 'response' in error) {
          const axiosError = error as AxiosError<ApiError>;

          if (axiosError.response?.data?.errors) {
            const serverErrors = axiosError.response.data.errors;

            Object.keys(serverErrors).forEach(field => {
              if (serverErrors[field] && serverErrors[field].length > 0) {
                form.setError(field as keyof DriverCreateFormData, {
                  type: 'server',
                  message: serverErrors[field][0],
                });
              }
            });
            toast.error('Исправьте ошибки в форме');
          } else {
            toast.error(axiosError.response?.data?.detail || 'Ошибка создания водителя');
          }
        } else {
          toast.error('Неизвестная ошибка при создании водителя');
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [form, onSuccess],
  );

  const getChapterStatus = useMemo(() => {
    return (chapterId: string): 'complete' | 'warning' | 'error' | 'pending' => {
      if (chapterId === 'basic') {
        return getBasicDataStatus(formData, errors, isSubmitted);
      }
      if (chapterId === 'security') {
        return getSecurityStatus(formData, errors, isSubmitted);
      }
      if (chapterId === 'driver-license') {
        return getDriverLicenseStatus(formData.profile, errors, isSubmitted);
      }
      if (chapterId === 'employment') {
        return getDriverEmploymentStatus(formData, errors, isSubmitted);
      }
      if (chapterId === 'passport-data') {
        return getPassportDataStatus(formData.profile, errors, isSubmitted);
      }
      if (chapterId === 'personal-info') {
        return getPersonalInfoStatus(formData.profile, errors, isSubmitted);
      }
      if (chapterId === 'ride-preferences') {
        return getRidePreferencesStatus(formData.profile, errors, isSubmitted);
      }

      return 'pending';
    };
  }, [formData, errors, isSubmitted]);

  const getChapterErrors = useMemo(() => {
    return (chapterId: string): string[] => {
      if (chapterId === 'basic') {
        return getBasicDataErrors(formData, errors, isSubmitted);
      }
      if (chapterId === 'security') {
        return getSecurityErrors(formData, errors, isSubmitted);
      }
      if (chapterId === 'driver-license') {
        return getDriverLicenseErrors(formData.profile, errors, isSubmitted);
      }
      if (chapterId === 'employment') {
        return getDriverEmploymentErrors(formData, errors, isSubmitted);
      }
      if (chapterId === 'passport-data') {
        return getPassportDataErrors(formData.profile, errors, isSubmitted);
      }
      if (chapterId === 'personal-info') {
        return getPersonalInfoErrors(formData.profile, errors, isSubmitted);
      }
      if (chapterId === 'ride-preferences') {
        return getRidePreferencesErrors(formData.profile, errors, isSubmitted);
      }

      return [];
    };
  }, [formData, errors, isSubmitted]);

  const onCreate = useCallback(async () => {
    console.log('=== onCreate CALLED ===');
    console.log('Triggering validation...');

    const isValid = await trigger();

    console.log('Form is valid:', isValid);
    console.log('Form errors after trigger:', JSON.stringify(form.formState.errors, null, 2));

    if (!isValid) {
      console.log('Form validation failed, not submitting');
      const firstErrorField = Object.keys(form.formState.errors)[0];
      console.log('First error field:', firstErrorField);

      if (firstErrorField) {
        setFocus(firstErrorField as keyof DriverCreateFormData);
      }

      return;
    }

    console.log('Form is valid, calling handleSubmit...');
    await handleSubmit(onSubmit)();
  }, [trigger, handleSubmit, onSubmit, form.formState.errors, setFocus]);

  const handleChapterClick = useCallback((chapterId: string) => {
    const element = document.getElementById(`chapter-${chapterId}`);

    if (element) {
      const yOffset = -20;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;

      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }, []);

  return {
    form,
    isSubmitting,
    getChapterStatus,
    getChapterErrors,
    onCreate,
    handleChapterClick,
    onBack,
    selectedRole,
  };
}
