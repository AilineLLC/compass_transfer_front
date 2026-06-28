'use client';

import { ExternalLink } from 'lucide-react';
import { Badge } from '@shared/ui/data-display/badge';
import { type ServiceClass, type CarType } from '@entities/tariffs/enums';
import { type GetTariffDTO } from '@entities/tariffs/interface';

interface TariffCardProps {
  tariff: GetTariffDTO;
  isSelected: boolean;
  userRole: string;
  onSelect: (tariff: GetTariffDTO) => void;
  onViewDetails?: (tariffId: string, event: React.MouseEvent) => void;
  canViewDetails?: boolean;
  formatPrice: (price: number) => string;
  getServiceClassLabel: (serviceClass: ServiceClass) => string;
  getCarTypeLabel: (carType: CarType) => string;
  getTariffBadgeColor: (serviceClass: ServiceClass | undefined) => string;
}

export function TariffCard({
  tariff,
  isSelected,
  onSelect,
  userRole,
  onViewDetails,
  canViewDetails = false,
  formatPrice,
  getServiceClassLabel,
  getCarTypeLabel,
  getTariffBadgeColor,
}: TariffCardProps) {
  return (
    <div
      role='button'
      tabIndex={tariff.archived ? -1 : 0}
      onClick={() => !tariff.archived && onSelect(tariff)}
      onKeyDown={e => { if (!tariff.archived && (e.key === 'Enter' || e.key === ' ')) onSelect(tariff); }}
      className={`p-3 rounded-lg border transition-all select-none relative ${
        tariff.archived
          ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200'
          : isSelected
            ? 'border-blue-500 bg-blue-50 shadow-sm ring-1 ring-blue-500/20 cursor-pointer'
            : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-slate-50 cursor-pointer'
      }`}
    >
      {/* Top row: radio + name + archive badge */}
      <div className='flex items-center gap-2 mb-1.5'>
        <div className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
          isSelected ? 'border-blue-500' : 'border-gray-300'
        }`}>
          {isSelected && <div className='w-1.5 h-1.5 rounded-full bg-blue-500' />}
        </div>
        <span className={`font-semibold text-sm leading-tight flex-1 min-w-0 truncate ${
          isSelected ? 'text-blue-800' : 'text-gray-900'
        }`}>
          {tariff.name}
        </span>
        {tariff.archived && (
          <Badge variant='outline' className='text-red-500 border-red-300 text-xs px-1 py-0 h-4 flex-shrink-0'>
            Архив
          </Badge>
        )}
        {canViewDetails && onViewDetails && (
          <button
            type='button'
            onClick={e => { e.stopPropagation(); onViewDetails(tariff.id, e); }}
            className='p-0.5 rounded hover:bg-gray-200 transition-colors flex-shrink-0'
            title='Открыть детали тарифа'
          >
            <ExternalLink className='h-3 w-3 text-gray-400 hover:text-blue-500' />
          </button>
        )}
      </div>

      {/* Class badge + car type */}
      <div className='flex items-center gap-1 mb-2'>
        <Badge className={`${getTariffBadgeColor(tariff.serviceClass)} text-xs px-1.5 py-0 h-4 font-medium`}>
          {getServiceClassLabel(tariff.serviceClass)}
        </Badge>
        <span className='text-xs text-gray-400 truncate'>{getCarTypeLabel(tariff.carType)}</span>
      </div>

      {/* Prices */}
      <div className='flex items-end justify-between gap-2'>
        <div>
          <div className={`text-sm font-bold leading-none ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>
            {formatPrice(tariff.basePrice)}
          </div>
          <div className='text-xs text-gray-400 mt-0.5'>базовая</div>
        </div>
        {userRole !== 'partner' && (
          <div className='text-right flex-shrink-0'>
            <div className='text-xs font-medium text-gray-600'>{formatPrice(tariff.perKmPrice)}/км</div>
          </div>
        )}
      </div>
    </div>
  );
}
