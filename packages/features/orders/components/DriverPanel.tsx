'use client';

import { Search, User, ChevronDown, ChevronUp, X, CalendarDays, RefreshCw, Calendar } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from '@shared/hooks/use-debounce';
import { Badge } from '@shared/ui/data-display/badge';
import { Button } from '@shared/ui/forms/button';
import { Input } from '@shared/ui/forms/input';
import { Card, CardContent } from '@shared/ui/layout/card';
import { CarTypeValues, type CarType } from '@entities/tariffs/enums/CarType.enum';
import { ServiceClassValues, type ServiceClass } from '@entities/tariffs/enums/ServiceClass.enum';
import type { GetDriverDTO } from '@entities/users/interface';
import type { GetCarDTO } from '@entities/cars/interface';
import { useDriverSearch } from '@features/drivers/hooks/useDriverSearch';
import { DriverCarSelectPanel } from '@features/orders/components/DriverCarSelectPanel';

function toDatetimeLocal(iso: string): string {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
}

interface DriverPanelProps {
  selectedDriver?: GetDriverDTO | null;
  onDriverSelect: (
    driver: GetDriverDTO | null,
    location?: { latitude: number; longitude: number },
    fromSearchPanel?: boolean,
  ) => void;
  onClose: () => void;
  activeDrivers?: Array<{ id: string; currentLocation?: { latitude: number; longitude: number } }>;
  getDriverById?: (id: string) => GetDriverDTO | null;
  isInstantOrder?: boolean;
  userRole?: 'admin' | 'operator' | 'driver';
  onViewDriverOrders?: (driverId: string, driverName: string) => void;
  requiredServiceClass?: string | null;
  scheduledTime?: string | null;
  completionTimeEstimate?: string | null;
}

export function DriverPanel({
  selectedDriver,
  onDriverSelect,
  onClose,
  activeDrivers = [],
  getDriverById,
  isInstantOrder = false,
  userRole: _userRole = 'operator',
  onViewDriverOrders,
  requiredServiceClass,
  scheduledTime,
  completionTimeEstimate,
}: DriverPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [allDrivers, setAllDrivers] = useState<GetDriverDTO[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [carSelectingDriver, setCarSelectingDriver] = useState<GetDriverDTO | null>(null);
  const [periodFrom, setPeriodFrom] = useState(() => scheduledTime ? toDatetimeLocal(scheduledTime) : '');
  const [periodTo, setPeriodTo] = useState(() => completionTimeEstimate ? toDatetimeLocal(completionTimeEstimate) : '');

  const { drivers, isLoading, searchDrivers, searchDriversByName } = useDriverSearch();
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const fetchDriversWithPeriod = useCallback(async (from: string, to: string) => {
    const data = await searchDrivers({
      role: ['Driver'],
      sortBy: 'fullName',
      sortOrder: 'Asc',
      ...(from && { hasNoScheduledOrdersFrom: new Date(from).toISOString() }),
      ...(to && { hasNoScheduledOrdersTo: new Date(to).toISOString() }),
    });
    setAllDrivers(data);
  }, [searchDrivers]);

  // Sync period from props and auto-fetch when scheduledTime/completionTimeEstimate change.
  // Fires on mount and whenever props update (e.g. after order data loads in edit mode).
  useEffect(() => {
    const from = scheduledTime ? toDatetimeLocal(scheduledTime) : '';
    const to = completionTimeEstimate ? toDatetimeLocal(completionTimeEstimate) : '';
    setPeriodFrom(from);
    setPeriodTo(to);
    fetchDriversWithPeriod(from, to);
  }, [scheduledTime, completionTimeEstimate, fetchDriversWithPeriod]);

  useEffect(() => {
    if (debouncedSearchQuery.trim().length >= 2) {
      searchDriversByName(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery, searchDriversByName]);

  const displayDrivers = (searchQuery.trim().length >= 2 ? drivers || [] : allDrivers || [])
    .filter(driver => {
      if (!isInstantOrder && requiredServiceClass) {
        const fullDriverData = getDriverById ? getDriverById(driver.id) : null;
        const activeCar = fullDriverData?.activeCar as Record<string, unknown> | undefined;
        if (activeCar?.serviceClass && (activeCar.serviceClass as string) !== requiredServiceClass) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      if (a.online && !b.online) return -1;
      if (!a.online && b.online) return 1;
      return (a.fullName || '').localeCompare(b.fullName || '');
    });

  const handleDriverClick = (driver: GetDriverDTO) => {
    if (isInstantOrder) return;
    setCarSelectingDriver(driver);
  };

  const selectDriver = (driver: GetDriverDTO, fullDriver: GetDriverDTO | null) => {
    let location = null;
    const activeDriver = activeDrivers.find(d => d.id === driver.id);
    if (activeDriver?.currentLocation) location = activeDriver.currentLocation;
    if (!location) {
      const driverWithLocation =
        (fullDriver as GetDriverDTO & { currentLocation?: { latitude: number; longitude: number } }) ||
        (allDrivers.find(d => d.id === driver.id) as GetDriverDTO & { currentLocation?: { latitude: number; longitude: number } }) ||
        (drivers.find(d => d.id === driver.id) as GetDriverDTO & { currentLocation?: { latitude: number; longitude: number } });
      location = driverWithLocation?.currentLocation;
    }
    onDriverSelect(driver, location, true);
    setSearchQuery('');
    setIsCollapsed(true);
  };

  const handleCarSelected = (car: GetCarDTO) => {
    if (!carSelectingDriver) return;
    const fullDriver = getDriverById ? getDriverById(carSelectingDriver.id) : null;
    const driverWithCar: GetDriverDTO = {
      ...(fullDriver ?? carSelectingDriver),
      activeCar: car,
      activeCarId: car.id,
    };
    setCarSelectingDriver(null);
    selectDriver(driverWithCar, driverWithCar);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value.trim().length > 0 && isCollapsed) setIsCollapsed(false);
    if (value.trim().length === 0 && !isCollapsed) setIsCollapsed(true);
  };

  return (
    <div className='absolute bottom-0 left-4 right-4 z-[1000] max-w-2xl mx-auto'>
      <Card className='backdrop-blur-sm bg-white/80 rounded-t-2xl border'>
        <CardContent className='p-3 sm:p-4'>

          {/* Выбранный водитель */}
          {selectedDriver && (() => {
            const fullDriverData = getDriverById ? getDriverById(selectedDriver.id) : null;
            const driverName = (fullDriverData?.fullName as string) || selectedDriver.fullName || `Водитель ${selectedDriver.id}`;
            const driverPhone = (fullDriverData?.phoneNumber as string) || selectedDriver.phoneNumber || 'Телефон не указан';
            const activeCar = fullDriverData?.activeCar as Record<string, unknown> | undefined;
            const carType = (activeCar?.type as string) || '';
            const carTypeTranslated = CarTypeValues[carType as unknown as CarType] || carType;
            const serviceClass = (activeCar?.serviceClass as string) || '';
            const serviceClassTranslated = ServiceClassValues[serviceClass as unknown as ServiceClass] || serviceClass;
            const licensePlate = (activeCar?.licensePlate as string) || '';

            return (
              <div className='mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='flex-shrink-0'>
                      <div className={`w-3 h-3 rounded-full ${selectedDriver.online ? 'bg-green-500' : 'bg-gray-400'}`} />
                    </div>
                    <div className='min-w-0 flex-1'>
                      <p className='text-sm font-medium text-gray-900 truncate'>{driverName}</p>
                      <div className='flex items-center gap-2 flex-wrap'>
                        <p className='text-xs text-gray-500'>{driverPhone}</p>
                        {serviceClassTranslated && <Badge variant='outline' className='text-xs px-1.5 py-0.5'>{serviceClassTranslated}</Badge>}
                        {carTypeTranslated && <Badge variant='secondary' className='text-xs px-1.5 py-0.5'>{carTypeTranslated}</Badge>}
                        {licensePlate && <Badge variant='outline' className='text-xs px-1.5 py-0.5 font-mono'>{licensePlate}</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className='flex items-center gap-1'>
                    {!isInstantOrder && onViewDriverOrders && (
                      <button onClick={() => onViewDriverOrders(selectedDriver.id, driverName)} className='p-1 rounded-full hover:bg-blue-100 transition-colors' title='Расписание водителя'>
                        <CalendarDays className='h-4 w-4 text-blue-600' />
                      </button>
                    )}
                    {!isInstantOrder && (
                      <button onClick={() => setCarSelectingDriver(selectedDriver)} className='p-1 rounded-full hover:bg-blue-100 transition-colors' title='Сменить машину'>
                        <RefreshCw className='h-4 w-4 text-blue-500' />
                      </button>
                    )}
                    {!isInstantOrder && (
                      <button onClick={onClose} className='p-1 rounded-full hover:bg-blue-100 transition-colors' title='Отменить выбор водителя'>
                        <X className='h-4 w-4 text-gray-500' />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Выбор машины */}
          {carSelectingDriver && (
            <DriverCarSelectPanel
              driverId={carSelectingDriver.id}
              driverName={carSelectingDriver.fullName}
              requiredServiceClass={requiredServiceClass}
              onSelect={handleCarSelected}
              onBack={() => setCarSelectingDriver(null)}
            />
          )}

          {/* Поиск + фильтр + список */}
          {!carSelectingDriver && (
            <div className='space-y-3'>
              {isInstantOrder ? (
                <div className='text-center py-4 px-3 bg-blue-50 border border-blue-200 rounded-lg'>
                  <div className='text-sm text-blue-800 font-medium mb-1'>Моментальный заказ</div>
                  <div className='text-xs text-blue-600'>Система автоматически найдет подходящего водителя</div>
                </div>
              ) : (
                <>
                  {/* Строка поиска */}
                  <div className='flex items-center gap-2'>
                    <div className='flex-1 relative'>
                      <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                      <Input
                        placeholder='Начните вводить имя водителя...'
                        value={searchQuery}
                        onChange={e => handleSearchChange(e.target.value)}
                        className='pl-10'
                      />
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='text-sm text-gray-500 whitespace-nowrap'>{displayDrivers.length} водителей</span>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className='h-10 px-3'
                        title={isCollapsed ? 'Показать список водителей' : 'Скрыть список водителей'}
                      >
                        {isCollapsed ? <ChevronUp className='h-4 w-4' /> : <ChevronDown className='h-4 w-4' />}
                      </Button>
                    </div>
                  </div>

                  {/* Фильтр по периоду */}
                  <div className='rounded-lg border bg-muted/30 px-2.5 py-2 space-y-1.5'>
                    <p className='text-xs font-medium text-muted-foreground flex items-center gap-1'>
                      <Calendar className='h-3 w-3' />
                      Без запланированных заказов
                    </p>
                    <div className='grid grid-cols-2 gap-1.5'>
                      <div className='space-y-0.5'>
                        <label className='text-xs text-muted-foreground'>Начало периода</label>
                        <Input type='datetime-local' value={periodFrom} onChange={e => setPeriodFrom(e.target.value)} className='h-7 text-xs px-2' />
                      </div>
                      <div className='space-y-0.5'>
                        <label className='text-xs text-muted-foreground'>Конец периода</label>
                        <Input type='datetime-local' value={periodTo} onChange={e => setPeriodTo(e.target.value)} className='h-7 text-xs px-2' />
                      </div>
                    </div>
                    <Button
                      variant='outline'
                      size='sm'
                      className='w-full h-6 text-xs'
                      onClick={() => fetchDriversWithPeriod(periodFrom, periodTo)}
                      disabled={isLoading}
                    >
                      <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                      Применить
                    </Button>
                  </div>

                  {/* Список водителей */}
                  <div className={`transition-all duration-300 overflow-hidden ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-64 sm:max-h-72 opacity-100'}`}>
                    <div className='overflow-y-auto max-h-64 sm:max-h-72 space-y-1.5 pt-1'>
                      {isLoading ? (
                        <div className='text-center py-4'>
                          <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto' />
                          <p className='text-sm text-gray-500 mt-2'>Загрузка водителей...</p>
                        </div>
                      ) : displayDrivers.length > 0 ? (
                        displayDrivers.map(driver => {
                          const fullDriverData = getDriverById ? getDriverById(driver.id) : null;
                          const driverName = (fullDriverData?.fullName as string) || driver.fullName || `Водитель ${driver.id}`;
                          const driverPhone = (fullDriverData?.phoneNumber as string) || driver.phoneNumber || '';
                          const activeRideStatus = driver.activeRideStatus;
                          const activeCar = fullDriverData?.activeCar as Record<string, unknown> | undefined;
                          const carType = (activeCar?.type as string) || '';
                          const carTypeTranslated = CarTypeValues[carType as unknown as CarType] || carType;
                          const serviceClasses = activeCar?.serviceClass ? [activeCar.serviceClass as string] : [];
                          const licensePlate = (activeCar?.licensePlate as string) || '';

                          return (
                            <div
                              key={driver.id}
                              className={`p-2.5 border rounded-lg transition-all duration-200 ${
                                isInstantOrder
                                  ? 'border-gray-200 bg-gray-50 cursor-default'
                                  : selectedDriver?.id === driver.id
                                    ? 'border-blue-500 bg-blue-50 shadow-sm cursor-pointer'
                                    : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300 cursor-pointer'
                              }`}
                              onClick={() => !isInstantOrder && handleDriverClick(driver)}
                            >
                              <div className='flex items-start gap-3'>
                                <div className='flex-shrink-0 mt-0.5'>
                                  <div className={`w-3 h-3 rounded-full ${driver.online ? 'bg-green-500' : 'bg-gray-400'}`} />
                                </div>
                                <div className='flex-1 min-w-0'>
                                  <div className='flex items-center justify-between gap-2 mb-1'>
                                    <div className='flex items-center gap-2 min-w-0'>
                                      <span className='font-medium text-sm text-gray-900 truncate'>{driverName}</span>
                                      <span className='text-xs text-gray-500 flex-shrink-0'>{driver.online ? 'Онлайн' : 'Оффлайн'}</span>
                                    </div>
                                    {!isInstantOrder && onViewDriverOrders && (
                                      <Button
                                        variant='ghost'
                                        size='sm'
                                        className='h-6 px-1.5 flex-shrink-0 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                                        onClick={e => { e.stopPropagation(); onViewDriverOrders(driver.id, driverName); }}
                                        title='Расписание водителя'
                                      >
                                        <CalendarDays className='h-3.5 w-3.5 mr-1' />
                                        Заказы
                                      </Button>
                                    )}
                                  </div>

                                  {activeRideStatus && (
                                    <div className='mb-1'>
                                      <span className={`inline-flex items-center text-xs font-medium px-1.5 py-0.5 rounded-full ${
                                        activeRideStatus === 'Arrived' ? 'bg-green-100 text-green-700'
                                        : activeRideStatus === 'InProgress' ? 'bg-amber-100 text-amber-700'
                                        : 'bg-slate-100 text-slate-600'
                                      }`}>
                                        {activeRideStatus === 'Arrived' && 'Прибыл'}
                                        {activeRideStatus === 'InProgress' && 'В пути'}
                                        {activeRideStatus === 'Paused' && 'Пауза'}
                                      </span>
                                    </div>
                                  )}

                                  {driverPhone && <p className='text-xs text-gray-600 mb-1'>{driverPhone}</p>}

                                  <div className='flex gap-1 flex-wrap'>
                                    {serviceClasses.slice(0, 2).map((cls: string) => (
                                      <Badge key={cls} variant='outline' className='text-xs px-1.5 py-0.5'>
                                        {ServiceClassValues[cls as unknown as ServiceClass] || cls}
                                      </Badge>
                                    ))}
                                    {carTypeTranslated && <Badge variant='secondary' className='text-xs px-1.5 py-0.5'>{carTypeTranslated}</Badge>}
                                    {licensePlate && <Badge variant='outline' className='text-xs px-1.5 py-0.5 font-mono'>{licensePlate}</Badge>}
                                    {serviceClasses.length > 2 && <Badge variant='outline' className='text-xs px-1.5 py-0.5'>+{serviceClasses.length - 2}</Badge>}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className='text-center py-4'>
                          <User className='h-8 w-8 text-gray-400 mx-auto mb-2' />
                          <p className='text-sm text-gray-500'>{searchQuery ? 'Водители не найдены' : 'Нет доступных водителей'}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
