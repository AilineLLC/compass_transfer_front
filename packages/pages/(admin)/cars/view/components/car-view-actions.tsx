'use client';

import { useState } from 'react';
import { Edit, Trash2, ArrowLeft, UserPlus, Settings } from 'lucide-react';
import { Button } from '@shared/ui/forms/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/layout';
import { DeleteConfirmationModal } from '@shared/ui/modals/delete-confirmation-modal';
import { useUserRole } from '@shared/contexts';
import { Role } from '@entities/users/enums';
import type { GetCarDTO } from '@entities/cars/interface';

interface CarViewActionsProps {
  car: GetCarDTO;
  onEdit: () => void;
  onDelete: () => void;
  onBack: () => void;
  onAddDriver?: () => void;
  onManageFeatures?: () => void;
}

export function CarViewActions({
  car,
  onEdit,
  onDelete,
  onBack,
  onAddDriver,
  onManageFeatures
}: CarViewActionsProps) {
  const { userRole } = useUserRole();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Проверяем права доступа
  const canEdit = userRole !== Role.Operator;
  const canDelete = userRole !== Role.Operator;

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

          {/* Кнопка "Добавить водителя" */}
          {canEdit && onAddDriver && car.drivers.length < 2 && (
            <Button
              variant='outline'
              onClick={onAddDriver}
              className='w-full justify-start'
            >
              <UserPlus className='mr-2 h-4 w-4' />
              Добавить водителя
            </Button>
          )}

          {/* Кнопка "Управление опциями" */}
          {canEdit && onManageFeatures && (
            <Button
              variant='outline'
              onClick={onManageFeatures}
              className='w-full justify-start'
            >
              <Settings className='mr-2 h-4 w-4' />
              Управление опциями
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

      {/* Модальное окно подтверждения удаления */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Удалить автомобиль"
        description={`Вы уверены, что хотите удалить автомобиль "${car.make} ${car.model}" (${car.licensePlate})? Это действие нельзя отменить.`}
      />
    </div>
  );
}
