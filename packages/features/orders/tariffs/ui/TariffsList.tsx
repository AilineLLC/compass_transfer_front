'use client';

import { Filter, RefreshCw } from 'lucide-react';
import { Button } from '@shared/ui/forms/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/layout/card';
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
}: TariffsListProps) {
  if (!tariffs || tariffs.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">Тарифы не найдены</p>
      </div>
    );
  }

  if (filteredTariffs.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                Выбор тарифа ({filteredTariffs.length} из {tariffs.length})
              </CardTitle>
              <div className="flex items-center gap-2">
                {/* Кнопка обновления тарифов */}
                {onRefreshTariffs && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRefreshTariffs}
                    disabled={isRefreshingTariffs}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${isRefreshingTariffs ? 'animate-spin' : ''}`} />
                    {isRefreshingTariffs ? 'Обновление...' : 'Обновить'}
                  </Button>
                )}

                {/* Кнопка фильтра архивных */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onToggleArchived}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  {showArchived ? 'Скрыть архивные' : 'Показать архивные'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className='px-0'>
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {showArchived
                  ? 'Нет тарифов для отображения'
                  : 'Нет активных тарифов. Попробуйте показать архивные тарифы.'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Выбор тарифа ({filteredTariffs.length} из {tariffs.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* Кнопка обновления тарифов */}
            {onRefreshTariffs && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefreshTariffs}
                disabled={isRefreshingTariffs}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshingTariffs ? 'animate-spin' : ''}`} />
                {isRefreshingTariffs ? 'Обновление...' : 'Обновить'}
              </Button>
            )}

            {/* Кнопка фильтра архивных */}
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleArchived}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              {showArchived ? 'Скрыть архивные' : 'Показать архивные'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 transition-opacity duration-300 ${
          isRefreshingTariffs ? 'opacity-50 pointer-events-none' : 'opacity-100'
        }`}>
          {filteredTariffs.map((tariff) => (
            <TariffCard
              key={tariff.id}
              tariff={tariff}
              isSelected={selectedTariff?.id === tariff.id}
              onSelect={onTariffSelect}
              onViewDetails={onViewTariffDetails}
              canViewDetails={canViewTariffDetails}
              formatPrice={formatPrice}
              getServiceClassLabel={getServiceClassLabel}
              getCarTypeLabel={getCarTypeLabel}
              getTariffBadgeColor={getTariffBadgeColor}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
