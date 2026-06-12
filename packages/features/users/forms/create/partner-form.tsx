'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ApiRequestError } from '@shared/api/client';
import { useState, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { usersApi } from '@shared/api/users';
import { logger, applyServerErrors } from '@shared/lib';
import { VerificationStatus, BusinessType } from '@entities/users/enums';
import type { CreatePartnerDTO } from '@entities/users/interface/CreatePartnerDTO';
import {
  getBasicDataStatus,
  getBasicDataErrors,
  getCompanyDataStatus,
  getCompanyDataErrors,
  getSecurityStatus,
  getSecurityErrors,
  getPartnerSaleStatus,
  getPartnerSaleErrors,
} from '@entities/users/model/validation/ui';
import {
  partnerCreateSchema,
  type PartnerCreateFormData,
} from '@entities/users/schemas/partnerCreateSchema';


export function usePartnerFormLogic({
  selectedRole,
  onBack,
  onSuccess,
}: {
  selectedRole: string;
  onBack: () => void;
  onSuccess: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PartnerCreateFormData>({
    resolver: zodResolver(partnerCreateSchema) as any,
    mode: 'onSubmit',
    defaultValues: {
      phoneNumber: '',
      fullName: '',
      avatarUrl: null,
      verificationStatus: VerificationStatus.Pending,
      sale: null,
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

  const getChapterStatus = useMemo(() => {
    return (chapterId: string): 'complete' | 'warning' | 'error' | 'pending' => {
      if (chapterId === 'basic') {
        return getBasicDataStatus(formData, errors, isSubmitted);
      }
      if (chapterId === 'business') {
        return getCompanyDataStatus(formData.profile, errors, isSubmitted);
      }
      if (chapterId === 'security') {
        return getSecurityStatus(formData, errors, isSubmitted);
      }
      if (chapterId === 'sale') {
        return getPartnerSaleStatus(formData, errors, isSubmitted);
      }

      return 'pending';
    };
  }, [formData, errors, isSubmitted]);

  const getChapterErrors = useMemo(() => {
    return (chapterId: string): string[] => {
      if (chapterId === 'basic') {
        return getBasicDataErrors(formData, errors, isSubmitted);
      }
      if (chapterId === 'business') {
        return getCompanyDataErrors(formData.profile, errors, isSubmitted);
      }
      if (chapterId === 'security') {
        return getSecurityErrors(formData, errors, isSubmitted);
      }
      if (chapterId === 'sale') {
        return getPartnerSaleErrors(formData, errors, isSubmitted);
      }

      return [];
    };
  }, [formData, errors, isSubmitted]);

  const onSubmit = useCallback(
    async (data: PartnerCreateFormData) => {
      setIsSubmitting(true);
      try {
        // Подготавливаем данные для API (исключаем confirmPassword)
        const { confirmPassword: _confirmPassword, ...formDataWithoutConfirm } = data;
        const apiData: CreatePartnerDTO = {
          ...formDataWithoutConfirm,
          phoneNumber: data.phoneNumber || null,
          avatarUrl: data.avatarUrl || null,
          verificationStatus: data.verificationStatus,
          sale: data.sale,
          profile: {
            companyName: data.profile.companyName,
            companyType: data.profile.companyType,
            registrationNumber: data.profile.registrationNumber,
            taxIdentifier: data.profile.taxIdentifier,
            legalAddress: data.profile.legalAddress,
            contactEmail: data.profile.contactEmail,
            contactPhone: data.profile.contactPhone,
            website: data.profile.website,
          },
        };
        const result = await usersApi.createPartner(apiData);

        if (result && result.fullName) {
          toast.success(`Контр-агент ${result.fullName} успешно создан!`);
        } else {
          toast.success('Контр-агент успешно создан!');
        }
        onSuccess();
      } catch (error) {
        if (error instanceof ApiRequestError) {
          const { errors: serverErrors, message } = error.apiError;
          if (serverErrors && Object.keys(serverErrors).length > 0) {
            toast.error(applyServerErrors(serverErrors, form.setError));
          } else {
            toast.error(message);
          }
        } else {
          toast.error(error instanceof Error ? error.message : 'Ошибка создания партнера');
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [form, onSuccess],
  );

  const onCreate = useCallback(async () => {
    const isValid = await trigger();

    if (!isValid) {
      const firstErrorField = Object.keys(form.formState.errors)[0];

      if (firstErrorField) {
        setFocus(firstErrorField as keyof PartnerCreateFormData);
      }

      return;
    }
    await (handleSubmit as any)(onSubmit)();
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
