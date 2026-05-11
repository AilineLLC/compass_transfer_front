'use client';

import { useState } from 'react';
import { carsApi, type CarFilters } from '@shared/api/cars';
import type { GetTariffDTOWithArchived } from '@shared/api/tariffs';
import { VehicleStatus, type ServiceClass, type VehicleType } from '@entities/cars/enums';
import type { GetCarDTO } from '@entities/cars/interface';
import { TariffCards, PremiumCarShowcase, PromoBanners } from './components';

interface OperatorDashboardProps {
  status?: string;
}

export function OperatorDashboard(_props: OperatorDashboardProps) {
  const [selectedTariff, setSelectedTariff] = useState<GetTariffDTOWithArchived | null>(null);
  const [cars, setCars] = useState<GetCarDTO[]>([]);
  const [loadingCars, setLoadingCars] = useState(false);

  const handleTariffSelect = async (tariff: GetTariffDTOWithArchived) => {
    setSelectedTariff(tariff);
    setLoadingCars(true);

    try {
      const params: CarFilters = {
        serviceClass: [tariff.serviceClass as ServiceClass],
        type: [tariff.carType as unknown as VehicleType],
        status: [VehicleStatus.Available],
        size: 20
      };

      const response = await carsApi.getCars(params);

      setCars(response.data);
    } catch {
      setCars([]);
    } finally {
      setLoadingCars(false);
    }
  };

  return (
    <div className='h-full flex flex-1 flex-col gap-2 border rounded-2xl overflow-hidden pr-2 bg-white'>
      <div className='flex flex-col overflow-hidden overflow-y-auto space-y-6'>
        {/* Карточки тарифов */}
        <TariffCards
          onTariffClick={handleTariffSelect}
          onFirstTariffLoaded={handleTariffSelect}
        />

        {/* Промо баннеры */}
        <PromoBanners userRole="operator" />

        {/* Премиум просмотр автомобилей */}
        {selectedTariff && (
          <div className='space-y-6'>
            <div className='text-right'>
              <h2 className='text-3xl font-bold text-gray-900'>
                Наш автапорк для тарифа {selectedTariff.name}
              </h2>
            </div>

            <PremiumCarShowcase
              cars={cars}
              isLoading={loadingCars}
              tariffName={selectedTariff.name}
            />
          </div>
        )}
      </div>
    </div>
  );
}
