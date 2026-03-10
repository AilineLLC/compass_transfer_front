'use client';

import { useState } from 'react';
import type { GetTariffDTOWithArchived } from '@shared/api/tariffs';
import { useUserRole } from '@shared/contexts/user-role-context';
import { Role } from '@entities/users/enums';
import { OrderTypeSelectionModal } from '@features/orders/ui/modal/order-type-selection-modal';
import { TariffCards } from '@pages/(admin)/dashboard/operator/components/tariff-cards';
import { useRouter } from 'next/navigation';

export function TariffCardsView() {
  const router = useRouter();
  const { userRole } = useUserRole();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTariff, setSelectedTariff] = useState<GetTariffDTOWithArchived | null>(null);

  // Преобразуем роль в строку для TariffCards
  const getRoleString = (): 'admin' | 'operator' | 'partner' | 'driver' | undefined => {
    switch (userRole) {
      case Role.Admin:
        return 'admin';
      case Role.Operator:
        return 'operator';
      case Role.Partner:
        return 'partner';
      case Role.Driver:
        return 'driver';
      default:
        return 'partner'; // По умолчанию партнер
    }
  };

  const handleTariffClick = (tariff: GetTariffDTOWithArchived) => {
    // Сохраняем выбранный тариф и открываем модалку выбора типа заказа
    setSelectedTariff(tariff);
    // setIsModalOpen(true);
    router.push('/orders/create/scheduled');
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedTariff(null);
  };

  return (
    <div>
      {/* Готовый компонент карточек тарифов */}
      <TariffCards
        onTariffClick={handleTariffClick}
        userRole={getRoleString()}
      />

      {/* Модалка выбора типа заказа */}
      <OrderTypeSelectionModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        selectedTariffId={selectedTariff?.id}
      />
    </div>
  );
}
