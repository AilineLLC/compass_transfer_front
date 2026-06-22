'use client';

import { Filter, RefreshCw } from 'lucide-react';
import { type ServiceClass, type CarType } from '@entities/tariffs/enums';
import { type GetTariffDTO } from '@entities/tariffs/interface';
import { TariffCard } from './TariffCard';

interface TariffsListProps {
  tariffs: GetTariffDTO[];
  filteredTariffs: GetTariffDTO[];
  selectedTariff: GetTariffDTO | null;
  showArchived: boolean;
  canViewTariffDetails?: boolean;
  onTariffSelect: (tariff: GetTariffDTO) => void;
  onViewTariffDetails?: (tariffId: string, event: React.MouseEvent) => void;
  onToggleArchived: () => void;
  onRefreshTariffs?: () => void;
  isRefreshingTariffs?: boolean;
  formatPrice: (price: number) => string;
  getServiceClassLabel: (serviceClass: ServiceClass) => string;
  getCarTypeLabel: (carType: CarType) => string;
  getTariffBadgeColor: (serviceClass: ServiceClass | undefined) => string;
  userRole: 'admin' | 'operator' | 'partner' | 'driver';
}

export function TariffsList({
  tariffs,
  filteredTariffs,
  selectedTariff,
  showArchived,
  canViewTariffDetails = false,
  onTariffSelect,
  onViewTariffDetails,
  onToggleArchived,
  onRefreshTariffs,
  isRefreshingTariffs = false,
  formatPrice,
  getServiceClassLabel,
  getCarTypeLabel,
  getTariffBadgeColor,
  userRole,
}: TariffsListProps) {
  if (!tariffs || tariffs.length === 0) {
    return <p className='text-sm text-gray-400 py-2'>Тарифы не найдены</p>;
  }

  return (
    <div>
      {/* Compact header */}
      <div className='flex items-center justify-between mb-2'>
        <span className='text-xs text-gray-400'>{filteredTariffs.length} тариф(а)</span>
        <div className='flex gap-1'>
          {onRefreshTariffs && (
            <button
              type='button'
              onClick={onRefreshTariffs}
              disabled={isRefreshingTariffs}
              className='inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 rounded hover:bg-gray-100 transition-colors disabled:opacity-50'
            >
              <RefreshCw className={`h-3 w-3 ${isRefreshingTariffs ? 'animate-spin' : ''}`} />
              {isRefreshingTariffs ? 'Обновление...' : 'Обновить'}
            </button>
          )}
          {userRole !== 'partner' && (
            <button
              type='button'
              onClick={onToggleArchived}
              className='inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 rounded hover:bg-gray-100 transition-colors'
            >
              <Filter className='h-3 w-3' />
              {showArchived ? 'Скрыть архивные' : 'Архивные'}
            </button>
          )}
        </div>
      </div>

      {filteredTariffs.length === 0 ? (
        <p className='text-sm text-gray-400 py-2 text-center'>
          {showArchived ? 'Нет тарифов' : 'Нет активных тарифов'}
        </p>
      ) : (
        <div
          className={`grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-0.5 transition-opacity duration-200 ${
            isRefreshingTariffs ? 'opacity-40 pointer-events-none' : ''
          }`}
        >
          {filteredTariffs.map(tariff => (
            <TariffCard
              key={tariff.id}
              tariff={tariff}
              isSelected={selectedTariff?.id === tariff.id}
              onSelect={onTariffSelect}
              onViewDetails={onViewTariffDetails}
              canViewDetails={canViewTariffDetails}
              formatPrice={formatPrice}
              userRole={userRole}
              getServiceClassLabel={getServiceClassLabel}
              getCarTypeLabel={getCarTypeLabel}
              getTariffBadgeColor={getTariffBadgeColor}
            />
          ))}
        </div>
      )}
    </div>
  );
}
