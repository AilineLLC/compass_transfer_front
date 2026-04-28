'use client';

import { useState, useEffect } from 'react';
import { Car, ExternalLink, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@shared/ui/modals/dialog';
import { Button } from '@shared/ui/forms/button';
import { Badge } from '@shared/ui/data-display/badge';


import { carsApi } from '@shared/api/cars';
import { CarColor, VehicleStatus } from '@entities/cars/enums';
import type { GetCarDTO } from '@entities/cars/interface';

interface ManageDriverCarsModalProps {
  isOpen: boolean;
  onClose: () => void;
  driverId: string;
  driverName: string;
  onAssignCar: () => void;
  onRefresh: () => void;
}

// Переводы для статусов автомобилей
const vehicleStatusLabels: Record<VehicleStatus, string> = {
  [VehicleStatus.Available]: 'Доступен',
  [VehicleStatus.Maintenance]: 'На обслуживании',
  [VehicleStatus.Repair]: 'На ремонте',
  [VehicleStatus.Other]: 'Другое',
};

// Переводы для цветов автомобилей
const carColorLabels: Record<CarColor, string> = {
  [CarColor.White]: 'Белый',
  [CarColor.Black]: 'Черный',
  [CarColor.Silver]: 'Серебристый',
  [CarColor.Gray]: 'Серый',
  [CarColor.Red]: 'Красный',
  [CarColor.Blue]: 'Синий',
  [CarColor.Green]: 'Зеленый',
  [CarColor.Yellow]: 'Желтый',
  [CarColor.Orange]: 'Оранжевый',
  [CarColor.Brown]: 'Коричневый',
  [CarColor.Purple]: 'Фиолетовый',
  [CarColor.Pink]: 'Розовый',
  [CarColor.Gold]: 'Золотой',
  [CarColor.Beige]: 'Бежевый',
  [CarColor.Maroon]: 'Бордовый',
};



export function ManageDriverCarsModal({
  isOpen,
  onClose,
  driverId,
  driverName,
  onAssignCar,
  onRefresh
}: ManageDriverCarsModalProps) {
  const [cars, setCars] = useState<GetCarDTO[]>([]);
  const [loading, setLoading] = useState(false);


  // Загрузка автомобилей водителя
  const loadDriverCars = async () => {
    try {
      setLoading(true);

      // Получаем все автомобили и фильтруем те, к которым назначен данный водитель
      const response = await carsApi.getCars({
        pageSize: 100,
      });

      const driverCars = response.data.filter(car =>
        car.drivers?.some(driver => driver.driverId === driverId)
      );

      setCars(driverCars);
    } catch (error) {
      console.error('Ошибка загрузки автомобилей водителя:', error);
      setCars([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadDriverCars();
    }
  }, [isOpen, driverId]);



  const handleViewCar = (carId: string) => {
    // Открываем страницу автомобиля в новой вкладке
    window.open(`/cars/${carId}`, '_blank');
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Управление автомобилями водителя</DialogTitle>
              <p className="text-sm text-gray-600 mt-1">
                Водитель: {driverName}
              </p>
            </div>
            <Button
              variant="default"
              size="sm"
              onClick={onAssignCar}
              className="flex items-center gap-2"
            >
              <Car className="h-4 w-4" />
              Назначить автомобиль
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Загрузка автомобилей...</span>
            </div>
          ) : cars.length === 0 ? (
            <div className="text-center py-8">
              <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">У водителя нет назначенных автомобилей</p>
              <Button
                variant="outline"
                onClick={onAssignCar}
                className="flex items-center gap-2"
              >
                <Car className="h-4 w-4" />
                Назначить первый автомобиль
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {cars.map((car) => (
                <div
                  key={car.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium">
                          {car.make} {car.model} ({car.year})
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {car.licensePlate}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {carColorLabels[car.color]}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{car.passengerCapacity} мест</span>
                        <span>•</span>
                        <span>{vehicleStatusLabels[car.status]}</span>
                        <span>•</span>
                        <span>Всего водителей: {car.drivers?.length || 0}/2</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Кнопка перехода к автомобилю */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewCar(car.id)}
                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        title="Открыть автомобиль в новой вкладке"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
