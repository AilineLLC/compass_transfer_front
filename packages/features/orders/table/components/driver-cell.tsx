'use client';

import { useState, useEffect } from 'react';
import { Search, Settings, User, UserCog } from 'lucide-react';
import { useDebounce } from '@shared/hooks/use-debounce';
import { Input } from '@shared/ui/forms/input';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/ui/layout/popover';
import type { GetOrderDTO } from '@entities/orders';
import { OrderType } from '@entities/orders/enums/OrderType.enum';
import { OrdersApi } from '@entities/orders/api/orders';
import type { RideWaypoint } from '@entities/orders/interface/CreateScheduledRideDTO';
import { useUserRole } from '@shared/contexts';
import { Role } from '@entities/users/enums';
import { useDriverById } from '@features/users/hooks/useDriverById';
import { useDriverSearch } from '@features/drivers/hooks/useDriverSearch';
import type { GetDriverDTO } from '@entities/users/interface';

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

  const { driver, isLoading: isLoadingDriver } = useDriverById(driverId);
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
    }
  };

  const handleSelectDriver = async (selected: GetDriverDTO) => {
    if (!order.id || isChanging) return;
    try {
      setIsChanging(true);

      await OrdersApi.changeDriver(order.id, {
        driverId: selected.id,
        carId: selected.activeCar?.id ?? '',
      });
      setOpen(false);
      onRefetch?.();
    } catch {
      // no-op: could add toast
    } finally {
      setIsChanging(false);
    }
  };

  if (!isScheduled || !canChangeDriver) {
    return <span className='flex flex-col'>
              <span className='text-sm'>{driver?.fullName || '—'}</span>
              <span className='text-sm'>{driver?.activeCar?.licensePlate}</span>
           </span>;
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
      <PopoverContent className='w-80 p-3' align='start'>
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
              <button
                key={d.id}
                onClick={() => handleSelectDriver(d)}
                disabled={isChanging}
                className={`w-full rounded-md px-2.5 py-2 text-left text-sm transition-colors disabled:opacity-50 ${
                  d.id === driverId
                    ? 'border border-blue-200 bg-blue-50'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className='flex items-center gap-2'>
                  <div
                    className={`h-2 w-2 shrink-0 rounded-full ${d.online ? 'bg-green-500' : 'bg-gray-300'}`}
                  />
                  <div className='min-w-0'>
                    <p className='truncate font-medium'>{d.fullName}</p>
                    {d.phoneNumber && (
                      <p className='truncate text-xs text-gray-500'>{d.phoneNumber}</p>
                    )}
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className='py-4 text-center'>
              <User className='mx-auto mb-1 h-6 w-6 text-gray-300' />
              <p className='text-sm text-gray-500'>Водители не найдены</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
