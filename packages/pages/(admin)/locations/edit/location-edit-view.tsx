'use client';

import { notFound, useRouter } from 'next/navigation';
import { useState, useEffect, useLayoutEffect, type MutableRefObject } from 'react';
import { FormProvider, type UseFormReturn } from 'react-hook-form';
import { locationsApi } from '@shared/api/locations';
import { Card, CardContent } from '@shared/ui/layout';
import { ChapterHeader } from '@shared/ui/layout/chapter-header';
import { FormSidebar } from '@shared/ui/layout/form-sidebar';
import {
  LocationBasicSection,
  LocationCoordinatesSection,
  LocationMapSection,
  LocationProfileSection,
} from '@entities/locations';
import type {
  ImageItem,
  PoiItemState,
  AdviceImageItem,
} from '@entities/locations';
import type { LocationDTO, LocationImageDTO, PoiItemDTO } from '@entities/locations/interface';
import { LocationType } from '@entities/locations/enums';
import { LOCATION_FORM_CHAPTERS } from '@entities/locations/model/form-chapters/location-chapters';
import type { LocationUpdateFormData } from '@entities/locations/schemas/locationUpdateSchema';
import { useLocationEditFormLogic } from '@features/locations/forms/edit/location-edit-form';

interface LocationEditViewProps {
  locationId: string;
}

interface LocationEditFormViewProps {
  form: UseFormReturn<LocationUpdateFormData>;
  isSubmitting: boolean;
  imageItemsRef: MutableRefObject<ImageItem[]>;
  poiItemsRef: MutableRefObject<PoiItemState[]>;
  onAdviceImageChange: (item: AdviceImageItem | null) => void;
  initialImages: LocationImageDTO[];
  initialPoi: PoiItemDTO[];
  existingAdviceImage: { id: string; path: string } | null;
  getChapterStatus: (chapterId: string) => 'complete' | 'warning' | 'error' | 'pending';
  getChapterErrors: (chapterId: string) => string[];
  onUpdate: () => void;
  handleChapterClick: (chapterId: string) => void;
  onBack: () => void;
}

export function LocationEditView({ locationId }: LocationEditViewProps) {
  const router = useRouter();
  const [location, setLocation] = useState<LocationDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialImages, setInitialImages] = useState<LocationImageDTO[]>([]);
  const [initialPoi, setInitialPoi] = useState<PoiItemDTO[]>([]);
  const [existingAdviceImage, setExistingAdviceImage] = useState<{ id: string; path: string } | null>(null);

  useEffect(() => {
    const loadLocation = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const locationData = await locationsApi.getLocationById(locationId);
        setLocation(locationData);
        setInitialImages(locationData.profile?.images ?? []);
        setInitialPoi(locationData.profile?.poi ?? []);
        const advImg = locationData.profile?.advice?.image;
        setExistingAdviceImage(advImg ? { id: advImg.id, path: advImg.path } : null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
      } finally {
        setIsLoading(false);
      }
    };

    if (locationId) loadLocation();
  }, [locationId]);

  const logic = useLocationEditFormLogic({
    locationId,
    initialData: {
      name: '',
      description: '',
      type: LocationType.Airport,
      address: '',
      latitude: 0,
      longitude: 0,
      isActive: true,
      popular: false,
      popular2: false,
      isLandingOnly: false,
      group: null,
      tags: [],
      advice: null,
      adviceImage: null,
      images: [],
      poi: [],
    },
    onBack: () => router.push('/locations'),
    onSuccess: () => router.push('/locations'),
  });

  useLayoutEffect(() => {
    if (location && logic.form) {
      const profile = location.profile;
      logic.form.reset({
        name: location.name || '',
        description: profile?.description || '',
        type: location.type,
        address: location.address || '',
        latitude: location.latitude || 0,
        longitude: location.longitude || 0,
        isActive: location.isActive ?? true,
        popular: location.popular1 ?? false,
        popular2: location.popular2 ?? false,
        isLandingOnly: location.isLandingOnly ?? false,
        isLandingPagePinned: location.isLandingPagePinned ?? false,
        group: location.group || '',
        tags: profile?.tags?.map(t => t.id) ?? [],
        advice: profile?.advice
          ? {
              fullName: profile.advice.fullName,
              specialization: profile.advice.specialization,
              content: profile.advice.content,
            }
          : null,
      });
    }
  }, [location, logic.form]);

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4' />
          <p>Загрузка данных локации...</p>
        </div>
      </div>
    );
  }

  if (error || !location) notFound();

  return (
    <LocationEditFormView
      {...logic}
      initialImages={initialImages}
      initialPoi={initialPoi}
      existingAdviceImage={existingAdviceImage}
    />
  );
}

function LocationEditFormView({
  form,
  isSubmitting,
  imageItemsRef,
  poiItemsRef,
  onAdviceImageChange,
  initialImages,
  initialPoi,
  existingAdviceImage,
  getChapterStatus,
  getChapterErrors,
  onUpdate,
  handleChapterClick,
  onBack,
}: LocationEditFormViewProps) {
  useEffect(() => {
    imageItemsRef.current = initialImages.map(img => ({
      kind: 'existing' as const,
      id: img.id,
      path: img.path,
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialImages]);

  useEffect(() => {
    poiItemsRef.current = initialPoi.map(p => ({
      name: p.name,
      imageState: p.image
        ? { kind: 'existing' as const, id: p.image.id, path: p.image.path }
        : { kind: 'empty' as const },
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPoi]);

  return (
    <FormProvider {...form}>
      <div className='flex overflow-hidden h-full pb-2'>
        <div className='shadow-md flex-1 h-full p-4 overflow-auto border bg-white rounded-2xl md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-[0_10px_40px_rgba(255,255,255,0.3)]'>
          <Card className='h-full flex flex-col overflow-auto pr-4'>
            <CardContent className='p-0'>
              <form className='flex flex-col gap-4'>
                {/* Глава 1: Основная информация */}
                <div id='chapter-basic' className='relative flex flex-col gap-4'>
                  <ChapterHeader number={1} title='Основная информация' status={getChapterStatus('basic')} />
                  <div className='relative ml-12'>
                    <div className='absolute -left-8 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-300' />
                    <LocationBasicSection
                      labels={{ name: 'Название локации *', type: 'Тип локации *', group: 'Группа локации' }}
                    />
                  </div>
                </div>

                {/* Глава 2: Карта */}
                <div id='chapter-map' className='relative flex flex-col gap-4'>
                  <ChapterHeader number={2} title='Местоположение на карте' status={getChapterStatus('map')} />
                  <div className='relative ml-12'>
                    <div className='absolute -left-8 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-300' />
                    <LocationMapSection labels={{ coordinates: 'Местоположение на карте *' }} />
                  </div>
                </div>

                {/* Глава 3: Настройки */}
                <div id='chapter-settings' className='relative flex flex-col gap-4'>
                  <ChapterHeader number={3} title='Настройки' status={getChapterStatus('settings')} />
                  <div className='relative ml-12'>
                    <div className='absolute -left-8 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-300' />
                    <LocationCoordinatesSection
                      labels={{
                        isActive: 'Активная локация',
                        popular: 'Топ точки (отображается в начале списка терминала)',
                      }}
                    />
                  </div>
                </div>

                {/* Глава 4: Профиль локации */}
                <div id='chapter-profile' className='relative flex flex-col gap-4'>
                  <ChapterHeader number={4} title='Профиль локации' status='pending' />
                  <div className='relative ml-12'>
                    <div className='absolute -left-8 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-300' />
                    <LocationProfileSection
                      existingImages={initialImages}
                      existingPoi={initialPoi}
                      existingAdviceImage={existingAdviceImage}
                      onImagesChange={items => { imageItemsRef.current = items; }}
                      onPoiChange={items => { poiItemsRef.current = items; }}
                      onAdviceImageChange={onAdviceImageChange}
                    />
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className='w-80 flex-shrink-0 flex flex-col h-full'>
          <FormSidebar
            chapters={LOCATION_FORM_CHAPTERS.EDIT}
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
