'use client';

import { useState } from 'react';
import { Edit, Trash2, ArrowLeft, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@shared/ui/forms/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/layout';
import { DeleteConfirmationModal } from '@shared/ui/modals/delete-confirmation-modal';
import { useUserRole } from '@shared/contexts';
import { Role } from '@entities/users/enums';
import type { LocationDTO } from '@entities/locations/interface';

interface LocationViewActionsProps {
  location: LocationDTO;
  onEdit: () => void;
  onDelete: () => void;
  onBack: () => void;
}

export function LocationViewActions({ location, onEdit, onDelete, onBack }: LocationViewActionsProps) {
  const { userRole } = useUserRole();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Проверяем права доступа
  const canEdit = userRole !== Role.Operator;
  const canDelete = userRole !== Role.Operator;



  // Открытие в Google Maps
  const handleOpenInGoogleMaps = () => {
    const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
    window.open(url, '_blank');
  };

  // Открытие в Яндекс Картах
  const handleOpenInYandexMaps = () => {
    const url = `https://yandex.ru/maps/?ll=${location.longitude},${location.latitude}&z=15&pt=${location.longitude},${location.latitude}`;
    window.open(url, '_blank');
  };

  // Открытие в 2ГИС
  const handleOpenIn2GIS = () => {
    const url = `https://2gis.ru/geo/${location.longitude},${location.latitude}`;
    window.open(url, '_blank');
  };

  // Обработчик подтверждения удаления
  const handleDeleteConfirm = async () => {
    await onDelete();
    setIsDeleteModalOpen(false);
  };

  return (
    <div className='sticky top-4 flex flex-col gap-4'>
      {/* Основные действия */}
      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>Действия</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          {/* Кнопка "Назад" */}
          <Button
            variant='outline'
            onClick={onBack}
            className='w-full justify-start'
          >
            <ArrowLeft className='mr-2 h-4 w-4' />
            Назад к списку
          </Button>

          {/* Кнопка "Редактировать" */}
          {canEdit && (
            <Button
              variant='default'
              onClick={onEdit}
              className='w-full justify-start'
            >
              <Edit className='mr-2 h-4 w-4' />
              Редактировать
            </Button>
          )}

          {/* Кнопка "Удалить" */}
          {canDelete && (
            <Button
              variant='destructive'
              onClick={() => setIsDeleteModalOpen(true)}
              className='w-full justify-start'
            >
              <Trash2 className='mr-2 h-4 w-4' />
              Удалить
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Дополнительные действия */}
      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>Открыть в картах</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          {/* Google Maps */}
          <Button
            variant='outline'
            onClick={handleOpenInGoogleMaps}
            className='w-full justify-start'
          >
            <MapPin className='mr-2 h-4 w-4' />
            Google Maps
          </Button>

          {/* Яндекс Карты */}
          <Button
            variant='outline'
            onClick={handleOpenInYandexMaps}
            className='w-full justify-start'
          >
            <MapPin className='mr-2 h-4 w-4' />
            Яндекс Карты
          </Button>

          {/* 2ГИС */}
          <Button
            variant='outline'
            onClick={handleOpenIn2GIS}
            className='w-full justify-start'
          >
            <MapPin className='mr-2 h-4 w-4' />
            2ГИС
          </Button>
        </CardContent>
      </Card>

      {/* Модальное окно подтверждения удаления */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Удалить локацию"
        description={`Вы уверены, что хотите удалить локацию "${location.name}"? Это действие нельзя отменить.`}
      />
    </div>
  );
}
