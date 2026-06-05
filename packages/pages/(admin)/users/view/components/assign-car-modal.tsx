'use client';

import { Search, Car, Plus, Loader2, Filter } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { carsApi, type CarFilters } from '@shared/api/cars';
import { Badge } from '@shared/ui/data-display/badge';
import { Button } from '@shared/ui/forms/button';
import { Input } from '@shared/ui/forms/input';
import { Label } from '@shared/ui/forms/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/forms/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@shared/ui/modals/dialog';
import { VehicleType, ServiceClass, VehicleStatus } from '@entities/cars/enums';
import { CarColorTranslations } from '@entities/cars/enums/CarColor.enum'
import { vehicleStatusLabels } from '@entities/cars/enums/VehicleStatus.enum'
import type { GetCarDTO } from '@entities/cars/interface';

interface AssignCarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssignCar: (carId: string) => Promise<void>;
  _driverId: string;
  driverName: string;
}


export function AssignCarModal({ 
  isOpen, 
  onClose, 
  onAssignCar, 
  _driverId,
  driverName
}: AssignCarModalProps) {
  const [cars, setCars] = useState<GetCarDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [assigningCarId, setAssigningCarId] = useState<string | null>(null);

  
  // Состояния фильтров
  const [filters, setFilters] = useState({
    status: undefined as VehicleStatus | undefined,
    type: undefined as VehicleType | undefined,
    serviceClass: undefined as ServiceClass | undefined,
  });

  // Загрузка автомобилей
  const loadCars = useCallback(async () => {
    try {
      setLoading(true);
      
      const params: CarFilters = {
        size: 50,
        Includes: 'Drivers',
      };

      // Поиск по номерному знаку или марке/модели
      if (searchQuery.trim()) {
        const query = searchQuery.trim();
        
        // Если содержит цифры или буквы в формате номера, ищем по номерному знаку
        if (/[0-9]/.test(query) || query.length <= 10) {
          params.licensePlate = query;
          params.licensePlateOp = 'Contains' as const;
        } else {
          // Иначе ищем по марке
          params.make = query;
          params.makeOp = 'Contains' as const;
        }
      }

      // Применяем фильтры
      if (filters.status !== undefined) {
        params.status = [filters.status];
      }

      if (filters.type !== undefined) {
        params.type = [filters.type];
      }

      if (filters.serviceClass !== undefined) {
        params.serviceClass = [filters.serviceClass];
      }

      // Показываем только доступные автомобили без назначенных водителей
      params.status = [VehicleStatus.Available];

      const response = await carsApi.getCars(params);
      
      // Фильтруем автомобили, у которых нет назначенных водителей или меньше 2 водителей
      const availableCars = response.data.filter(car => 
        !car.drivers || car.drivers.length < 2
      );
      
      setCars(availableCars);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Ошибка загрузки автомобилей:', error);
      setCars([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters]);

  useEffect(() => {
    if (!isOpen) return;

    const timeoutId = setTimeout(loadCars, 300);

    return () => clearTimeout(timeoutId);
  }, [isOpen, loadCars]);

  const handleAssignCar = async (carId: string) => {
    try {
      setAssigningCarId(carId);
      await onAssignCar(carId);
      handleClose();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Ошибка назначения автомобиля:', error);
    } finally {
      setAssigningCarId(null);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setShowFilters(false);
    setAssigningCarId(null);
    onClose();
  };

  const resetFilters = () => {
    setFilters({
      status: undefined,
      type: undefined,
      serviceClass: undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Назначить автомобиль водителю</DialogTitle>
          <p className="text-sm text-gray-600">
            Водитель: {driverName}
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Поиск и фильтры */}
          <div className="space-y-4">
            {/* Строка поиска */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder='Поиск по номерному знаку или марке автомобиля...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='pl-10'
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Фильтры
              </Button>
            </div>

            {/* Панель фильтров */}
            {showFilters && (
              <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Фильтры</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetFilters}
                    className="text-xs"
                  >
                    Сбросить
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Тип автомобиля */}
                  <div className="space-y-2">
                    <Label>Тип автомобиля</Label>
                    <Select
                      value={filters.type || 'all'}
                      onValueChange={(value) => 
                        setFilters(prev => ({
                          ...prev,
                          type: value === 'all' ? undefined : value as VehicleType
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Все типы" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все типы</SelectItem>
                        <SelectItem value={VehicleType.Sedan}>Седан</SelectItem>
                        <SelectItem value={VehicleType.Hatchback}>Хэтчбек</SelectItem>
                        <SelectItem value={VehicleType.SUV}>Внедорожник</SelectItem>
                        <SelectItem value={VehicleType.Minivan}>Минивэн</SelectItem>
                        <SelectItem value={VehicleType.Coupe}>Купе</SelectItem>
                        <SelectItem value={VehicleType.Cargo}>Грузовой</SelectItem>
                        <SelectItem value={VehicleType.Pickup}>Пикап</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Класс обслуживания */}
                  <div className="space-y-2">
                    <Label>Класс обслуживания</Label>
                    <Select
                      value={filters.serviceClass || 'all'}
                      onValueChange={(value) => 
                        setFilters(prev => ({
                          ...prev,
                          serviceClass: value === 'all' ? undefined : value as ServiceClass
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Все классы" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все классы</SelectItem>
                        <SelectItem value={ServiceClass.Economy}>Эконом</SelectItem>
                        <SelectItem value={ServiceClass.Comfort}>Комфорт</SelectItem>
                        <SelectItem value={ServiceClass.Business}>Бизнес</SelectItem>
                        <SelectItem value={ServiceClass.Premium}>Премиум</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Список автомобилей */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Загрузка автомобилей...</span>
              </div>
            ) : cars.length === 0 ? (
              <div className="text-center py-8">
                <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Доступных автомобилей не найдено</p>
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
                            {CarColorTranslations[car.color]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{car.passengerCapacity} мест</span>
                          <span>•</span>
                          <span>{vehicleStatusLabels[car.status]}</span>
                          <span>•</span>
                          <span>Водителей: {car.drivers?.length || 0}/2</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size='sm'
                          onClick={() => handleAssignCar(car.id)}
                          disabled={assigningCarId === car.id}
                          className='flex items-center gap-2'
                        >
                          {assigningCarId === car.id ? (
                            <Loader2 className='h-4 w-4 animate-spin' />
                          ) : (
                            <Plus className='h-4 w-4' />
                          )}
                          Назначить
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
