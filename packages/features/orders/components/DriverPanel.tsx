'use client';

import { Search, User, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useDebounce } from '@shared/hooks/use-debounce';
import { Badge } from '@shared/ui/data-display/badge';
import { Button } from '@shared/ui/forms/button';
import { Input } from '@shared/ui/forms/input';
import { Card, CardContent } from '@shared/ui/layout/card';
import { CarTypeValues, type CarType } from '@entities/tariffs/enums/CarType.enum';
import { ServiceClassValues, type ServiceClass } from '@entities/tariffs/enums/ServiceClass.enum';
import type { GetDriverDTO } from '@entities/users/interface';
import { useDriverSearch } from '@features/drivers/hooks/useDriverSearch';

interface DriverPanelProps {
  selectedDriver?: GetDriverDTO | null;
  onDriverSelect: (driver: GetDriverDTO | null, location?: { latitude: number; longitude: number }, fromSearchPanel?: boolean) => void;
  onClose: () => void;
  activeDrivers?: Array<{ id: string; currentLocation?: { latitude: number; longitude: number } }>; // Активные водители с карты
  getDriverById?: (id: string) => GetDriverDTO | null; // Функция для получения полных данных водителя
  isInstantOrder?: boolean; // Флаг для моментальных заказов - отключает выбор водителей
  userRole?: 'admin' | 'operator' | 'driver'; // Роль пользователя
}

export function DriverPanel({ selectedDriver, onDriverSelect, onClose, activeDrivers = [], getDriverById, isInstantOrder = false, userRole: _userRole = 'operator' }: DriverPanelProps) {
  // Хуки должны быть вызваны всегда, независимо от условий
  const [searchQuery, setSearchQuery] = useState('');
  const [allDrivers, setAllDrivers] = useState<GetDriverDTO[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(true); // По умолчанию скрыта

  const { drivers, isLoading, searchDrivers, searchDriversByName } = useDriverSearch();

  // Debounce поискового запроса
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Загружаем всех водителей при монтировании
  useEffect(() => {
    const loadAllDrivers = async () => {
      const allDriversData = await searchDrivers({
        role: ['Driver'],
        sortBy: 'fullName',
        sortOrder: 'Asc'
      });

      setAllDrivers(allDriversData);
    };

    loadAllDrivers();
  }, [searchDrivers]);

  // Поиск водителей при изменении debounced запроса
  useEffect(() => {
    if (debouncedSearchQuery.trim().length >= 2) {
      searchDriversByName(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery, searchDriversByName]);

  // Партнеры не должны видеть панель водителей (убираем проверку, так как partner не входит в тип)

  // Определяем какие водители показывать и сортируем их (онлайн водители сверху)
  const displayDrivers = (searchQuery.trim().length >= 2 ? (drivers || []) : (allDrivers || []))
    .sort((a, b) => {
      // Сначала сортируем по статусу онлайн (онлайн водители сверху)
      if (a.online && !b.online) return -1;
      if (!a.online && b.online) return 1;

      // Затем по имени
      return (a.fullName || '').localeCompare(b.fullName || '');
    });

  const handleDriverClick = (driver: GetDriverDTO) => {
    // В моментальных заказах не разрешаем выбор водителей
    if (isInstantOrder) {
      return;
    }

    // Ищем координаты водителя в разных источниках данных
    let location = null;

    // 1. Сначала ищем в активных водителях с карты
    const activeDriver = activeDrivers.find(d => d.id === driver.id);

    if (activeDriver?.currentLocation) {
      location = activeDriver.currentLocation;
    }

    // 2. Если не нашли, ищем в загруженных данных
    if (!location) {
      const driverWithLocation = allDrivers.find(d => d.id === driver.id) ||
                                drivers.find(d => d.id === driver.id);

      location = (driverWithLocation as GetDriverDTO & { currentLocation?: { latitude: number; longitude: number } })?.currentLocation;
    }



    onDriverSelect(driver, location, true); // true = выбор из панели поиска
    setSearchQuery('');
    setIsCollapsed(true); // Скрываем панель после выбора водителя
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);

    // Автоматически открываем панель при начале ввода
    if (value.trim().length > 0 && isCollapsed) {
      setIsCollapsed(false);
    }

    // Автоматически скрываем панель если очистили поиск
    if (value.trim().length === 0 && !isCollapsed) {
      setIsCollapsed(true);
    }
  };

  return (
    <div className="absolute bottom-4 left-4 right-4 z-[1000] max-w-xl mx-auto">
      <Card className="backdrop-blur-sm bg-white/55 rounded-t-2xl border">
        <CardContent className="p-3 sm:p-4">
          {/* Выбранный водитель */}
          {selectedDriver && (() => {
            // Получаем полные данные водителя из кэша (БЕЗ автоматической загрузки)
            const fullDriverData = getDriverById ? getDriverById(selectedDriver.id) : null;
            const driverName = (fullDriverData?.fullName as string) || selectedDriver.fullName || `Водитель ${selectedDriver.id}`;
            const driverPhone = (fullDriverData?.phoneNumber as string) || selectedDriver.phoneNumber || 'Телефон не указан';

            // Получаем данные автомобиля
            const activeCar = fullDriverData?.activeCar as Record<string, unknown> | undefined;
            const carType = activeCar?.type as string || '';
            const carTypeTranslated = CarTypeValues[carType as unknown as CarType] || carType;
            const serviceClass = activeCar?.serviceClass as string || '';
            const serviceClassTranslated = ServiceClassValues[serviceClass as unknown as ServiceClass] || serviceClass;
            const licensePlate = activeCar?.licensePlate as string || '';

            return (
              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <div className={`w-3 h-3 rounded-full ${
                        selectedDriver.online ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {driverName}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs text-gray-500">
                          {driverPhone}
                        </p>
                        {serviceClassTranslated && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                            {serviceClassTranslated}
                          </Badge>
                        )}
                        {carTypeTranslated && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                            {carTypeTranslated}
                          </Badge>
                        )}
                        {licensePlate && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0.5 font-mono">
                            {licensePlate}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {!isInstantOrder && (
                    <button
                      onClick={onClose}
                      className="p-1 rounded-full hover:bg-blue-100 transition-colors"
                      title="Отменить выбор водителя"
                    >
                      <X className="h-4 w-4 text-gray-500" />
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Поиск водителей или информация о моментальном заказе */}
          <div className="space-y-3">
            {isInstantOrder ? (
              <div className="text-center py-4 px-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-blue-800 font-medium mb-1">
                  Моментальный заказ
                </div>
                <div className="text-xs text-blue-600">
                  Система автоматически найдет подходящего водителя
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Начните вводить имя водителя..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 whitespace-nowrap">
                    {displayDrivers.length} водителей
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="h-10 px-3"
                    title={isCollapsed ? "Показать список водителей" : "Скрыть список водителей"}
                  >
                    {isCollapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}

            {/* Список водителей */}
            <div className={`transition-all duration-300 overflow-y-auto ${
              isCollapsed ? 'max-h-0 opacity-0' : 'max-h-40 sm:max-h-48 opacity-100'
            }`}>
              <div className="overflow-y-auto space-y-1.5 pt-2">
              {isLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto" />
                  <p className="text-sm text-gray-500 mt-2">Загрузка водителей...</p>
                </div>
              ) : displayDrivers.length > 0 ? (
                displayDrivers.map((driver) => {
                  // Получаем полные данные водителя из кэша
                  const fullDriverData = getDriverById ? getDriverById(driver.id) : null;
                  const driverName = (fullDriverData?.fullName as string) || driver.fullName || `Водитель ${driver.id}`;
                  const driverPhone = (fullDriverData?.phoneNumber as string) || driver.phoneNumber || '';

                  // Получаем данные автомобиля
                  const activeCar = fullDriverData?.activeCar as Record<string, unknown> | undefined;
                  const carType = activeCar?.type as string || '';
                  const carTypeTranslated = CarTypeValues[carType as unknown as CarType] || carType;
                  const serviceClasses = (activeCar?.serviceClass ? [activeCar.serviceClass as string] : []);
                  const licensePlate = activeCar?.licensePlate as string || '';

                  return (
                    <div
                      key={driver.id}
                      className={`p-2.5 border rounded-lg transition-all duration-200 ${
                        isInstantOrder
                          ? 'border-gray-200 bg-gray-50 cursor-default' // Для моментальных заказов - неактивный вид
                          : selectedDriver?.id === driver.id
                            ? 'border-blue-500 bg-blue-50 shadow-sm cursor-pointer'
                            : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300 cursor-pointer'
                      }`}
                      onClick={() => !isInstantOrder && handleDriverClick(driver)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className={`w-3 h-3 rounded-full ${
                            driver.online ? 'bg-green-500' : 'bg-gray-400'
                          }`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm text-gray-900 truncate">
                              {driverName}
                            </span>
                            <span className="text-xs text-gray-500">
                              {driver.online ? 'Онлайн' : 'Оффлайн'}
                            </span>
                          </div>

                          {driverPhone && (
                            <p className="text-xs text-gray-600 mb-1">{driverPhone}</p>
                          )}

                          <div className="flex gap-1 flex-wrap">
                            {/* Классы обслуживания с переводом */}
                            {serviceClasses.slice(0, 2).map((cls: string) => (
                              <Badge key={cls} variant="outline" className="text-xs px-1.5 py-0.5">
                                {ServiceClassValues[cls as unknown as ServiceClass] || cls}
                              </Badge>
                            ))}

                            {/* Тип автомобиля */}
                            {carTypeTranslated && (
                              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                                {carTypeTranslated}
                              </Badge>
                            )}

                            {/* Госномер */}
                            {licensePlate && (
                              <Badge variant="outline" className="text-xs px-1.5 py-0.5 font-mono">
                                {licensePlate}
                              </Badge>
                            )}

                            {serviceClasses.length > 2 && (
                              <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                                +{serviceClasses.length - 2}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4">
                  <User className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    {searchQuery ? 'Водители не найдены' : 'Нет доступных водителей'}
                  </p>
                </div>
              )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
