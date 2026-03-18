'use client';

import { Car, Clock, ExternalLink } from 'lucide-react';
import Image from 'next/image';
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
      className={`border rounded-lg overflow-hidden transition-all ${
        tariff.archived
          ? 'opacity-60 cursor-not-allowed bg-gray-50'
          : 'cursor-pointer hover:shadow-md'
      } ${
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200'
      }`}
      onClick={() => onSelect(tariff)}
    >
      {/* Изображение автомобиля */}
      <div className="relative h-32 w-full">
        <Image
          src="/auto/eqm5_banner_1.jpg"
          alt={`Автомобиль ${tariff.name}`}
          fill
          className="object-cover"
        />
        {/* Ленточка с типом тарифа */}
        <div className="absolute top-2 left-2">
          <Badge className={`${getTariffBadgeColor(tariff.serviceClass)} font-semibold`}>
            {getServiceClassLabel(tariff.serviceClass)}
          </Badge>
        </div>
        {/* Индикатор выбора */}
        {isSelected && (
          <div className="absolute top-2 right-2">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Информация о тарифе */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-lg">{tariff.name}</h3>

          {/* Иконка детального просмотра - только для Admin и Operator */}
          {canViewDetails && onViewDetails && (
            <button
              onClick={(e) => onViewDetails(tariff.id, e)}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              title="Открыть детали тарифа в новой вкладке"
            >
              <ExternalLink className="h-4 w-4 text-gray-500 hover:text-blue-500" />
            </button>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Car className="h-4 w-4" />
            <span>{getCarTypeLabel(tariff.carType)}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground block">Базовая цена:</span>
              <p className="font-semibold text-primary">{formatPrice(tariff.basePrice)}</p>
            </div>
            {
              userRole !== 'partner' && 
              <div>
                <span className="text-muted-foreground block">За км:</span>
                <p className="font-semibold">{formatPrice(tariff.perKmPrice)}</p>
              </div>
            }
            <div>
              <span className="text-muted-foreground block">Бесплатное ожидание:</span>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="font-semibold">{tariff.freeWaitingTimeMinutes} мин</span>
              </div>
            </div>
            {
              userRole !== 'partner' && 
              <div>
                  <span className="text-muted-foreground block">За минуту:</span>
                  <p className="font-semibold">{formatPrice(tariff.minutePrice)}</p>
                </div>
            }
          </div>

          <div className="pt-2 space-y-2">
            {tariff.archived ? (
              <Badge variant="outline" className="text-red-600 border-red-600">
                Архивный тариф
              </Badge>
            ) : (
              <Badge variant="outline" className="text-green-600 border-green-600">
                Доступный тариф
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
