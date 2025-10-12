'use client';

import { useState } from 'react';
import { Edit, Trash2, ArrowLeft, Archive, ArchiveRestore } from 'lucide-react';
import { Button } from '@shared/ui/forms/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/layout';
import { DeleteConfirmationModal } from '@shared/ui/modals/delete-confirmation-modal';
import { useUserRole } from '@shared/contexts';
import { Role } from '@entities/users/enums';
import type { GetTariffDTOWithArchived } from '@entities/tariffs/interface';

interface TariffViewActionsProps {
  tariff: GetTariffDTOWithArchived;
  onEdit: () => void;
  onDelete: () => void;
  onToggleArchive: () => void;
  onBack: () => void;
}

export function TariffViewActions({ 
  tariff, 
  onEdit, 
  onDelete, 
  onToggleArchive, 
  onBack 
}: TariffViewActionsProps) {
  const { userRole } = useUserRole();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Проверяем права доступа
  const canEdit = userRole !== Role.Operator;
  const canDelete = userRole !== Role.Operator;
  const canArchive = userRole !== Role.Operator;

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

          {/* Кнопка "Архивировать/Разархивировать" */}
          {canArchive && (
            <Button
              variant='outline'
              onClick={onToggleArchive}
              className='w-full justify-start'
            >
              {tariff.archived ? (
                <>
                  <ArchiveRestore className='mr-2 h-4 w-4' />
                  Разархивировать
                </>
              ) : (
                <>
                  <Archive className='mr-2 h-4 w-4' />
                  Архивировать
                </>
              )}
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
        title="Удалить тариф"
        description={`Вы уверены, что хотите удалить тариф "${tariff.name}"? Это действие нельзя отменить.`}
      />
    </div>
  );
}
