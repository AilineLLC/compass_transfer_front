'use client';

import type { GetOrderServiceDTO } from '@entities/orders/interface';
import type { GetServiceDTO } from '@entities/services/interface';
import { useOrderServices, ServicesList } from '@features/orders/services';

interface ServicesTabProps {
  services: GetServiceDTO[];
  selectedServices: GetOrderServiceDTO[];
  handleServicesChange: (services: GetOrderServiceDTO[]) => void;
  isInstantOrder?: boolean;
  [key: string]: unknown;
}

export function ServicesTab({
  services,
  selectedServices,
  handleServicesChange,
  isInstantOrder = false,
}: ServicesTabProps) {
  const { handleServiceToggle, handleServiceQuantityChange, formatPrice } = useOrderServices({
    services,
    selectedServices,
    handleServicesChange,
    isInstantOrder,
  });

  return (
    <ServicesList
      services={services}
      selectedServices={selectedServices}
      onToggle={handleServiceToggle}
      onQuantityChange={handleServiceQuantityChange}
      formatPrice={formatPrice}
    />
  );
}
