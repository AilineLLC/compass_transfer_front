'use client';

import type { GetOrderServiceDTO } from '@entities/orders/interface';
import type { GetServiceDTO } from '@entities/services/interface';
import { ServiceCard } from './ServiceCard';

interface ServicesListProps {
  services: GetServiceDTO[];
  selectedServices: GetOrderServiceDTO[];
  onToggle: (serviceId: string, isQuantifiable: boolean) => void;
  onQuantityChange: (serviceId: string, quantity: number) => void;
  formatPrice: (price: number) => string;
}

export function ServicesList({
  services,
  selectedServices,
  onToggle,
  onQuantityChange,
  formatPrice,
}: ServicesListProps) {
  if (!services || services.length === 0) {
    return <p className='text-sm text-gray-400'>Нет доступных услуг</p>;
  }

  return (
    <div className='flex flex-wrap gap-2'>
      {services.map(service => (
        <ServiceCard
          key={service.id}
          service={service}
          selectedServices={selectedServices}
          onToggle={onToggle}
          onQuantityChange={onQuantityChange}
          formatPrice={formatPrice}
        />
      ))}
    </div>
  );
}
