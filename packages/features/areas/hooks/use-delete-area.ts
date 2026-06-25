'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { locationGroupsApi } from '@shared/api/location-groups';
import type { LocationGroupDTO } from '@shared/api/location-groups';

interface UseDeleteAreaProps {
  onSuccess?: () => void;
}

export function useDeleteArea({ onSuccess }: UseDeleteAreaProps = {}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [areaToDelete, setAreaToDelete] = useState<LocationGroupDTO | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openDeleteModal = (area: LocationGroupDTO) => {
    setAreaToDelete(area);
    setIsModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsModalOpen(false);
    setAreaToDelete(null);
  };

  const confirmDelete = async () => {
    if (!areaToDelete) return;
    setIsDeleting(true);
    try {
      await locationGroupsApi.deleteLocationGroup(areaToDelete.id);
      toast.success(`Область "${areaToDelete.name}" удалена`);
      closeDeleteModal();
      onSuccess?.();
    } catch {
      toast.error('Ошибка при удалении области');
    } finally {
      setIsDeleting(false);
    }
  };

  const getDeleteModalProps = () => ({
    title: 'Удалить область',
    description: areaToDelete
      ? `Вы уверены, что хотите удалить область "${areaToDelete.name}"? Это действие нельзя отменить.`
      : '',
    confirmText: 'Удалить',
    cancelText: 'Отмена',
    isLoading: isDeleting,
  });

  return { isModalOpen, openDeleteModal, closeDeleteModal, confirmDelete, getDeleteModalProps, isDeleting };
}
