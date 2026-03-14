'use client';

import { type GetTariffDTO } from '@entities/tariffs/interface';
import { Role } from '@entities/users/enums';
import { useOrderTariffs, TariffsList } from '@features/orders/tariffs';

interface TariffPricingTabProps {
  tariffs: GetTariffDTO[];
  selectedTariff: GetTariffDTO | null;
  setSelectedTariff: (tariff: GetTariffDTO | null) => void;
  onRefreshTariffs?: () => void;
  isRefreshingTariffs?: boolean;
  userRole: 'admin' | 'operator' | 'partner' | 'driver';
  initialTariffId?: string; // ID тарифа для предварительного выбора
}

export function TariffPricingTab({
  tariffs,
  selectedTariff,
  setSelectedTariff,
  onRefreshTariffs,
  isRefreshingTariffs = false,
  userRole,
  initialTariffId
}: TariffPricingTabProps) {
  // Используем хук для логики работы с тарифами
  const {
    showArchived,
    filteredTariffs,
    canViewTariffDetails,
    handleTariffSelect,
    handleViewTariffDetails,
    toggleArchivedVisibility,
    formatPrice,
    getServiceClassLabel,
    getCarTypeLabel,
    getTariffBadgeColor,
  } = useOrderTariffs({
    tariffs,
    selectedTariff,
    setSelectedTariff,
    onRefreshTariffs,
    isRefreshingTariffs,
    initialTariffId
  });




  // Используем TariffsList компонент для отображения списка тарифов
  return (
    <div className="space-y-6">
      <TariffsList
        tariffs={tariffs}
        filteredTariffs={filteredTariffs}
        selectedTariff={selectedTariff}
        showArchived={showArchived}
        canViewTariffDetails={canViewTariffDetails}
        onTariffSelect={handleTariffSelect}
        onViewTariffDetails={handleViewTariffDetails}
        onToggleArchived={toggleArchivedVisibility}
        onRefreshTariffs={onRefreshTariffs}
        isRefreshingTariffs={isRefreshingTariffs}
        formatPrice={formatPrice}
        userRole={userRole}
        getServiceClassLabel={getServiceClassLabel}
        getCarTypeLabel={getCarTypeLabel}
        getTariffBadgeColor={getTariffBadgeColor}
      />
    </div>
  );
}
