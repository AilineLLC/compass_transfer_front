'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, CalendarDays, Search, Settings, User } from 'lucide-react';
import { toast } from 'sonner';
import { useDebounce } from '@shared/hooks/use-debounce';
import { Input } from '@shared/ui/forms/input';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/ui/layout/popover';
import type { GetOrderDTO } from '@entities/orders';
import { OrderType } from '@entities/orders/enums/OrderType.enum';
import { OrdersApi } from '@entities/orders/api/orders';
import { useUserRole } from '@shared/contexts';
import { Role } from '@entities/users/enums';
import { useDriverById } from '@features/users/hooks/useDriverById';
import { useDriverSearch } from '@features/drivers/hooks/useDriverSearch';
import type { GetDriverDTO } from '@entities/users/interface';
import { DriverOrdersWidget } from '@features/orders/components/DriverOrdersWidget';
import { DriverCarSelectPanel } from '@features/orders/components/DriverCarSelectPanel';
import { useTariffById } from '@shared/hooks/useTariffById';
import { ServiceClassValues } from '@entities/tariffs/enums/ServiceClass.enum';
import type { GetCarDTO } from '@entities/cars/interface';

interface DriverCellProps {
  order: GetOrderDTO;
  onRefetch?: () => void;
}

export function DriverCell({ order, onRefetch }: DriverCellProps) {
  const driverId = order.rides?.[0]?.driverId ?? null;
  const isScheduled = order.type === OrderType.Scheduled;
  const { userRole } = useUserRole();
  const canChangeDriver = userRole === Role.Admin || userRole === Role.Operator;

  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isChanging, setIsChanging] = useState(false);
  const [viewingDriverId, setViewingDriverId] = useState<string | null>(null);
  const [viewingDriverName, setViewingDriverName] = useState('');
  const [carSelectingDriver, setCarSelectingDriver] = useState<GetDriverDTO | null>(null);

  const { driver } = useDriverById(driverId);
  const { tariff } = useTariffById(order.tariffId);
  const { drivers, isLoading: isSearching, searchDrivers, searchDriversByName } = useDriverSearch();
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (!open) return;
    if (debouncedSearch.trim().length >= 2) {
      searchDriversByName(debouncedSearch);
    } else {
      searchDrivers({ role: ['Driver'], sortBy: 'fullName', sortOrder: 'Asc' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, open]);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      searchDrivers({ role: ['Driver'], sortBy: 'fullName', sortOrder: 'Asc' });
    } else {
      setSearchQuery('');
      setViewingDriverId(null);
      setViewingDriverName('');
      setCarSelectingDriver(null);
    }
  };

  const handleViewDriverOrders = (id: string, name: string) => {
    setViewingDriverId(id);
    setViewingDriverName(name);
  };

  const handleSelectDriver = (selected: GetDriverDTO) => {
    if (!order.id || isChanging) return;

    if (!selected.activeCar?.id) {
      setCarSelectingDriver(selected);
      return;
    }

    void assignDriver(selected, selected.activeCar.id);
  };

  const assignDriver = async (selected: GetDriverDTO, carId: string, selectedCar?: GetCarDTO) => {
    if (!order.id) return;

    const carServiceClass = selectedCar?.serviceClass ?? selected.activeCar?.serviceClass;
    if (tariff?.serviceClass && carServiceClass !== tariff.serviceClass) {
      const driverClass = ServiceClassValues[carServiceClass as keyof typeof ServiceClassValues] || carServiceClass || '—';
      const orderClass = ServiceClassValues[tariff.serviceClass as keyof typeof ServiceClassValues] || tariff.serviceClass;
      toast.error(
        `Класс автомобиля водителя "${driverClass}" не соответствует классу заказа "${orderClass}".`,
      );
      return;
    }

    try {
      setIsChanging(true);
      await OrdersApi.changeDriver(order.id, {
        driverId: selected.id,
        carId,
      });
      toast.success(`Водитель успешно изменён на ${selected.fullName}`);
      setOpen(false);
      onRefetch?.();
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : 'Не удалось сменить водителя. Попробуйте ещё раз.';
      toast.error(message);
    } finally {
      setIsChanging(false);
    }
  };

  const handleCarSelected = (car: GetCarDTO) => {
    if (!carSelectingDriver) return;
    setCarSelectingDriver(null);
    void assignDriver(carSelectingDriver, car.id, car);
  };

  if (!isScheduled || !canChangeDriver) {
    return (
      <span className='flex flex-col'>
        <span className='text-sm'>{driver?.fullName || '—'}</span>
        <span className='text-sm'>{driver?.activeCar?.licensePlate}</span>
      </span>
    );
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          disabled={isChanging}
          className='group flex items-center gap-1.5 text-sm transition-colors hover:text-blue-600 disabled:opacity-50'
        >
          <span className='flex flex-col text-center'>
            <span className='text-sm'>{driver?.fullName || '—'}</span>
            <span className='text-xs text-zinc-700'>{driver?.activeCar?.licensePlate}</span>
          </span>
          <Settings className='h-3.5 w-3.5 shrink-0 text-gray-400 group-hover:text-blue-500' />
        </button>
      </PopoverTrigger>

      <PopoverContent className={`${viewingDriverId ? 'w-96' : 'w-80'} p-3`} align='start'>
        {carSelectingDriver ? (
          /* Выбор машины водителя (нет activeCar) */
          <DriverCarSelectPanel
            driverId={carSelectingDriver.id}
            driverName={carSelectingDriver.fullName}
            requiredServiceClass={tariff?.serviceClass ?? null}
            onSelect={handleCarSelected}
            onBack={() => setCarSelectingDriver(null)}
          />
        ) : viewingDriverId ? (
          /* Просмотр расписания выбранного водителя */
          <div>
            <div className='mb-3 flex items-center gap-2'>
              <button
                onClick={() => {
                  setViewingDriverId(null);
                  setViewingDriverName('');
                }}
                className='rounded-full p-1 transition-colors hover:bg-gray-100'
                title='Назад к списку водителей'
              >
                <ArrowLeft className='h-4 w-4 text-gray-600' />
              </button>
              <span className='truncate text-sm font-medium text-gray-700'>
                {viewingDriverName}
              </span>
            </div>
            <DriverOrdersWidget
              driverId={viewingDriverId}
              currentOrderScheduledTime={order.scheduledTime ?? null}
            />
          </div>
        ) : (
          /* Список водителей для смены */
          <div>
            <p className='mb-2 text-xs font-medium text-gray-500'>Сменить водителя</p>
            <div className='relative mb-2'>
              <Search className='absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400' />
              <Input
                placeholder='Имя водителя...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='h-8 pl-8 text-sm'
              />
            </div>
            <div className='max-h-52 space-y-1 overflow-y-auto'>
              {isSearching ? (
                <div className='py-4 text-center text-sm text-gray-500'>Загрузка...</div>
              ) : drivers.length > 0 ? (
                drivers.map(d => (
                  <div
                    key={d.id}
                    className={`group/item flex items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors ${
                      d.id === driverId
                        ? 'border border-blue-200 bg-blue-50'
                        : 'hover:bg-gray-50'
                    } ${isChanging ? 'pointer-events-none opacity-50' : ''}`}
                  >
                    <button
                      onClick={() => handleSelectDriver(d)}
                      disabled={isChanging}
                      className='flex min-w-0 flex-1 items-center gap-2 text-left'
                    >
                      <div
                        className={`h-2 w-2 shrink-0 rounded-full ${d.online ? 'bg-green-500' : 'bg-gray-300'}`}
                      />
                      <div className='min-w-0 flex-1'>
                        <p className='truncate font-medium'>{d.fullName}</p>
                        {d.phoneNumber && (
                          <p className='truncate text-xs text-gray-500'>{d.phoneNumber}</p>
                        )}
                        {!d.activeCar?.id && (
                          <p className='text-xs text-amber-600'>Нет активного авто</p>
                        )}
                      </div>
                    </button>
                    <button
                      onClick={() => handleViewDriverOrders(d.id, d.fullName)}
                      className='shrink-0 rounded-full p-1 opacity-0 transition-all hover:bg-blue-100 group-hover/item:opacity-100'
                      title='Заказы водителя'
                    >
                      <CalendarDays className='h-3.5 w-3.5 text-blue-600' />
                    </button>
                  </div>
                ))
              ) : (
                <div className='py-4 text-center'>
                  <User className='mx-auto mb-1 h-6 w-6 text-gray-300' />
                  <p className='text-sm text-gray-500'>Водители не найдены</p>
                </div>
              )}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
