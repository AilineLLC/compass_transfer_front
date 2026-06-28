'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { AxiosError } from 'axios';
import { useState, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { usersApi } from '@shared/api/users';
import { logger, applyServerErrors } from '@shared/lib';
import {
  EmploymentType,
  IdentityDocumentType,
  type VerificationStatus,
} from '@entities/users/enums';
import type { DriverProfile } from '@entities/users/interface/DriverProfile';
import type { Employment } from '@entities/users/interface/Employment';
import type { UpdateDriverDTO } from '@entities/users/interface/UpdateDriverDTO';
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
import {
  driverUpdateSchema,
  type DriverUpdateFormData,
} from '@entities/users/schemas/driverUpdateSchema';

type ApiError = {
  detail?: string;
  errors?: Record<string, string[]>;
};

export function useDriverEditFormLogic({
  driverId,
  initialData,
  onBack,
  onSuccess,
}: {
  driverId: string;
  initialData: {
    fullName: string;
    email: string;
    phoneNumber?: string | null;
    avatarUrl?: string | null;
    verificationStatus: VerificationStatus;
    profile: DriverProfile;
    employment?: Employment;
  };
  onBack: () => void;
  onSuccess: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(driverUpdateSchema),
    mode: 'onSubmit',
    defaultValues: {
      fullName: initialData.fullName,
      phoneNumber: initialData.phoneNumber || '',
      avatarUrl: initialData.avatarUrl || null,
      verificationStatus: initialData.verificationStatus,
      profile: {
        ...initialData.profile,
        totalRides: initialData.profile.totalRides ?? 0,
        totalDistance: initialData.profile.totalDistance ?? 0,
        trainingCompleted: initialData.profile.trainingCompleted ?? false,
        passport: {
          number: initialData.profile.passport?.number ?? '',
          series: initialData.profile.passport?.series ?? '',
          issueDate: initialData.profile.passport?.issueDate ?? '',
          issuedBy: initialData.profile.passport?.issuedBy ?? '',
          page: initialData.profile.passport?.page ?? null,
          expiryDate: initialData.profile.passport?.expiryDate ?? null,
          identityType:
            initialData.profile.passport?.identityType ?? IdentityDocumentType.NationalPassport,
        },
      },
      employment: initialData.employment || {
        companyName: '',
        employmentType: EmploymentType.Percentage,
        percentage: null,
        fixedAmount: null,
      },
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

  const onSubmit = useCallback(
    async (data: DriverUpdateFormData) => {
      setIsSubmitting(true);
      try {
        const nullifyEmptyDate = (val: string | null | undefined) =>
          val === '' || val === undefined ? null : val;

        const apiData = {
          ...data,
          phoneNumber: data.phoneNumber || null,
          avatarUrl: data.avatarUrl || null,
          profile: {
            ...data.profile,
            lastRideDate: nullifyEmptyDate(data.profile.lastRideDate),
            medicalExamDate: nullifyEmptyDate(data.profile.medicalExamDate),
            backgroundCheckDate: nullifyEmptyDate(data.profile.backgroundCheckDate),
            passport: data.profile.passport ? {
              ...data.profile.passport,
              issueDate: nullifyEmptyDate(data.profile.passport.issueDate),
              expiryDate: nullifyEmptyDate(data.profile.passport.expiryDate),
            } : undefined,
          } as any,
        };
        const result = await usersApi.updateDriver(driverId, apiData as UpdateDriverDTO);

        if (result && result.fullName) {
          toast.success(`Водитель ${result.fullName} успешно обновлен!`);
        } else {
          toast.success('Водитель успешно обновлен!');
        }
        onSuccess();
      } catch (error) {
        logger.warn('Ошибка обновления водителя:', error);
        if (error instanceof Error && 'response' in error) {
          const axiosError = error as AxiosError<ApiError>;

          if (axiosError.response?.data?.errors) {
            toast.error(applyServerErrors(axiosError.response.data.errors, form.setError));
          } else {
            toast.error(axiosError.response?.data?.detail || 'Ошибка обновления водителя');
          }
        } else {
          toast.error('Неизвестная ошибка при обновлении водителя');
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [form, onSuccess, driverId],
  );

  const getChapterStatus = useMemo(() => {
    return (chapterId: string): 'complete' | 'warning' | 'error' | 'pending' => {
      if (chapterId === 'basic') {
        // Для формы редактирования используем упрощенную проверку
        const hasErrors = errors.fullName || errors.phoneNumber;
        const allRequiredFilled = formData.fullName && formData.fullName.length > 0;

        if (hasErrors) return 'error';
        if (allRequiredFilled) return 'complete';

        return 'pending';
      }
      if (chapterId === 'security') {
        // В форме редактирования нет полей безопасности
        return 'complete';
      }
      if (chapterId === 'driver-license') {
        return getDriverLicenseStatus(formData.profile as any, errors, isSubmitted);
      }
      if (chapterId === 'employment') {
        return getDriverEmploymentStatus(formData, errors, isSubmitted);
      }
      if (chapterId === 'passport-data') {
        return getPassportDataStatus(formData.profile as any, errors, isSubmitted);
      }
      if (chapterId === 'personal-info') {
        return getPersonalInfoStatus(formData.profile as any, errors, isSubmitted);
      }
      if (chapterId === 'ride-preferences') {
        return getRidePreferencesStatus(formData.profile, errors, isSubmitted);
      }
      if (chapterId === 'tests') {
        // Тесты всегда считаем завершенными (заглушка)
        return 'complete';
      }

      return 'pending';
    };
  }, [formData, errors, isSubmitted]);

  const getChapterErrors = useMemo(() => {
    return (chapterId: string): string[] => {
      if (chapterId === 'basic') {
        // Для формы редактирования используем упрощенную проверку ошибок
        const errorList: string[] = [];

        if (errors.fullName?.message) errorList.push(errors.fullName.message);
        if (errors.phoneNumber?.message) errorList.push(errors.phoneNumber.message);

        return errorList;
      }
      if (chapterId === 'security') {
        // В форме редактирования нет полей безопасности
        return [];
      }
      if (chapterId === 'driver-license') {
        return getDriverLicenseErrors(formData.profile as any, errors, isSubmitted);
      }
      if (chapterId === 'employment') {
        return getDriverEmploymentErrors(formData, errors, isSubmitted);
      }
      if (chapterId === 'passport-data') {
        return getPassportDataErrors(formData.profile as any, errors, isSubmitted);
      }
      if (chapterId === 'personal-info') {
        return getPersonalInfoErrors(formData.profile as any, errors, isSubmitted);
      }
      if (chapterId === 'ride-preferences') {
        return getRidePreferencesErrors(formData.profile as any, errors, isSubmitted);
      }
      if (chapterId === 'tests') {
        // Тесты не имеют ошибок (заглушка)
        return [];
      }

      return [];
    };
  }, [formData, errors, isSubmitted]);

  const onUpdate = useCallback(async () => {
    const isValid = await trigger();

    if (!isValid) {
      const firstErrorField = Object.keys(form.formState.errors)[0];

      if (firstErrorField) {
        setFocus(firstErrorField as keyof DriverUpdateFormData);
      }

      return;
    }
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
    onUpdate,
    handleChapterClick,
    onBack,
  };
}
