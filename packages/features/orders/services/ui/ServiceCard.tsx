'use client';

import { Check, Minus, Plus } from 'lucide-react';
import type { GetOrderServiceDTO } from '@entities/orders/interface';
import type { GetServiceDTO } from '@entities/services/interface';

interface ServiceCardProps {
  service: GetServiceDTO;
  selectedServices: GetOrderServiceDTO[];
  onToggle: (serviceId: string, isQuantifiable: boolean) => void;
  onQuantityChange: (serviceId: string, quantity: number) => void;
  formatPrice: (price: number) => string;
}

export function ServiceCard({
  service,
  selectedServices,
  onToggle,
  onQuantityChange,
  formatPrice,
}: ServiceCardProps) {
  const selectedService = selectedServices.find(s => s.serviceId === service.id);
  const quantity = selectedService?.quantity || 0;
  const isSelected = quantity > 0;

  if (service.isQuantifiable) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-all ${
          isSelected
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-200 bg-white'
        }`}
      >
        <span className='font-medium text-sm text-gray-800'>{service.name}</span>
        <span className='text-gray-400 text-xs'>{formatPrice(service.price)}</span>
        {isSelected ? (
          <>
            <button
              type='button'
              onClick={() => onQuantityChange(service.id, quantity - 1)}
              className='w-5 h-5 rounded flex items-center justify-center hover:bg-gray-200 transition-colors text-gray-600'
            >
              <Minus className='h-3 w-3' />
            </button>
            <span className='w-5 text-center font-semibold text-sm text-blue-700'>{quantity}</span>
            <button
              type='button'
              onClick={() => onQuantityChange(service.id, quantity + 1)}
              className='w-5 h-5 rounded flex items-center justify-center hover:bg-blue-200 transition-colors text-blue-600 bg-blue-100'
            >
              <Plus className='h-3 w-3' />
            </button>
          </>
        ) : (
          <button
            type='button'
            onClick={() => onToggle(service.id, true)}
            className='w-5 h-5 rounded flex items-center justify-center bg-blue-500 text-white hover:bg-blue-600 transition-colors'
          >
            <Plus className='h-3 w-3' />
          </button>
        )}
      </div>
    );
  }

  return (
    <button
      type='button'
      onClick={() => onToggle(service.id, false)}
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50 text-blue-700'
          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      {isSelected && <Check className='h-3.5 w-3.5 text-blue-500 flex-shrink-0' />}
      <span className='font-medium'>{service.name}</span>
      <span className={`text-xs ${isSelected ? 'text-blue-500' : 'text-gray-400'}`}>
        {formatPrice(service.price)}
      </span>
    </button>
  );
}
