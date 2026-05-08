'use client';

import { useState } from 'react';
import { carsApi } from '@shared/api/cars';
import type { GetTariffDTOWithArchived } from '@shared/api/tariffs';
import { VehicleStatus, type ServiceClass, type VehicleType } from '@entities/cars/enums';
import type { GetCarDTO } from '@entities/cars/interface';
import { TariffCards, PremiumCarShowcase, PromoBanners } from '../operator/components';

interface PartnerDashboardProps {
  status?: string;
  userRole?: 'admin' | 'operator' | 'partner' | 'driver';
}

export function PartnerDashboard({ userRole = 'partner' }: PartnerDashboardProps) {
  const [selectedTariff, setSelectedTariff] = useState<GetTariffDTOWithArchived | null>(null);
  const [cars, setCars] = useState<GetCarDTO[]>([]);
  const [loadingCars, setLoadingCars] = useState(false);

  const handleTariffSelect = (tariff: GetTariffDTOWithArchived) => {
    setSelectedTariff(tariff);
    loadCarsForTariff(tariff);
  };

  const loadCarsForTariff = async (tariff: GetTariffDTOWithArchived) => {
    setLoadingCars(true);
    try {
      const response = await carsApi.getCars({
        status: [VehicleStatus.Available],
        serviceClass: [tariff.serviceClass as ServiceClass],
        type: [tariff.carType as VehicleType],
      });

      setCars(response.data || []);
    } catch {
      setCars([]);
    } finally {
      setLoadingCars(false);
    }
  };

  return (
    <div className='h-full flex flex-1 flex-col gap-2 border rounded-2xl overflow-hidden pr-2 bg-white'>
      <div className='flex flex-col overflow-hidden overflow-y-auto pl-4 pr-2 py-4 space-y-6'>
        {/* Карточки тарифов */}
        <TariffCards
          onTariffClick={handleTariffSelect}
          onFirstTariffLoaded={handleTariffSelect}
        />

        {/* Промо баннеры */}
        <PromoBanners userRole="partner" />

        {/* Премиум просмотр автомобилей */}
        {selectedTariff && (
          <div className='space-y-6'>
            <div className='text-right'>
              <h2 className='text-3xl font-bold text-gray-900'>
                Наш автопарк для тарифа {selectedTariff.name}
              </h2>
            </div>

            <PremiumCarShowcase
              cars={cars}
              isLoading={loadingCars}
              tariffName={selectedTariff.name}
              userRole={userRole}
            />
          </div>
        )}
      </div>
    </div>
  );
}
