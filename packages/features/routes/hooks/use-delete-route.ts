'use client';

import { useState } from 'react';
import { routesApi } from '@shared/api/routes';
import type { RouteDTO } from '@entities/routes/interface/PartnerRouteDTO';

interface UseDeleteRouteProps {
  onSuccess?: () => void;
}

export function useDeleteRoute({ onSuccess }: UseDeleteRouteProps = {}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState<RouteDTO | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openDeleteModal = (route: RouteDTO) => {
    setRouteToDelete(route);
    setIsModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsModalOpen(false);
    setRouteToDelete(null);
  };

  const confirmDelete = async () => {
    if (!routeToDelete) return;

    setIsDeleting(true);
    try {
      await routesApi.deleteRoute(routeToDelete.id);
      closeDeleteModal();
      onSuccess?.();
    } catch (error) {
      console.error('Ошибка при удалении направления:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getDeleteModalProps = () => ({
    title: 'Удалить направление',
    description: routeToDelete
      ? `Вы уверены, что хотите удалить направление "${routeToDelete.name}"? Это действие нельзя отменить.`
      : '',
    confirmText: 'Удалить',
    cancelText: 'Отмена',
    isLoading: isDeleting,
  });

  return {
    isModalOpen,
    openDeleteModal,
    closeDeleteModal,
    confirmDelete,
    getDeleteModalProps,
    isDeleting,
  };
}
