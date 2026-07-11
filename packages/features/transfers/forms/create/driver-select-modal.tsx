'use client';

import { Search, User, X, Phone, Car, Calendar, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Badge } from '@shared/ui/data-display/badge';
import { Button } from '@shared/ui/forms/button';
import { Input } from '@shared/ui/forms/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@shared/ui/layout/dialog';
import type { GetDriverDTO } from '@entities/users/interface';
import { useDriverSearch } from '@features/drivers/hooks/useDriverSearch';

function toDatetimeLocal(iso: string): string {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
}

interface DriverSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (driver: GetDriverDTO) => void;
  selectedDriverId?: string | null;
  scheduledTime?: string | null;
  completionTimeEstimate?: string | null;
}

export function DriverSelectModal({
  isOpen,
  onClose,
  onSelect,
  selectedDriverId,
  scheduledTime,
  completionTimeEstimate,
}: DriverSelectModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [allDrivers, setAllDrivers] = useState<GetDriverDTO[]>([]);
  const [periodFrom, setPeriodFrom] = useState('');
  const [periodTo, setPeriodTo] = useState('');

  const { drivers, isLoading, searchDrivers, searchDriversByName } = useDriverSearch();

  // Синхронизируем начальные значения периода с пропсами при открытии
  useEffect(() => {
    if (!isOpen) return;
    setPeriodFrom(scheduledTime ? toDatetimeLocal(scheduledTime) : '');
    setPeriodTo(completionTimeEstimate ? toDatetimeLocal(completionTimeEstimate) : '');
  }, [isOpen, scheduledTime, completionTimeEstimate]);

  const fetchDrivers = (from: string, to: string) => {
    searchDrivers({
      role: ['Driver'],
      sortBy: 'fullName',
      sortOrder: 'Asc',
      ...(from && { hasNoScheduledOrdersFrom: new Date(from).toISOString() }),
      ...(to && { hasNoScheduledOrdersTo: new Date(to).toISOString() }),
    }).then(setAllDrivers);
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchDrivers(periodFrom, periodTo);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, searchDrivers]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        searchDriversByName(searchQuery.trim());
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, isOpen, searchDriversByName]);

  useEffect(() => {
    if (!isOpen) setSearchQuery('');
  }, [isOpen]);

  const displayDrivers = (searchQuery.trim().length >= 2 ? drivers : allDrivers).sort((a, b) => {
    if (a.online && !b.online) return -1;
    if (!a.online && b.online) return 1;
    return (a.fullName || '').localeCompare(b.fullName || '');
  });

  const handleSelect = (driver: GetDriverDTO) => {
    onSelect(driver);
    onClose();
  };

  const handleApplyFilter = () => {
    fetchDrivers(periodFrom, periodTo);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='w-[600px] h-[80vh] flex flex-col z-[1000]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-lg'>
            <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10'>
              <User className='h-4 w-4 text-primary' />
            </div>
            Выберите водителя
          </DialogTitle>
        </DialogHeader>

        <div className='relative my-2'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Поиск по имени, телефону...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className='pl-10 h-10'
            autoFocus
          />
        </div>

        {/* Фильтр по периоду занятости */}
        <div className='rounded-lg border bg-muted/40 px-3 py-2.5 space-y-2'>
          <p className='text-xs font-medium text-muted-foreground flex items-center gap-1.5'>
            <Calendar className='h-3.5 w-3.5' />
            Без запланированных заказов
          </p>
          <div className='grid grid-cols-2 gap-2'>
            <div className='space-y-1'>
              <label className='text-xs text-muted-foreground'>Начало периода</label>
              <Input
                type='datetime-local'
                value={periodFrom}
                onChange={e => setPeriodFrom(e.target.value)}
                className='h-8 text-xs'
              />
            </div>
            <div className='space-y-1'>
              <label className='text-xs text-muted-foreground'>Конец периода</label>
              <Input
                type='datetime-local'
                value={periodTo}
                onChange={e => setPeriodTo(e.target.value)}
                className='h-8 text-xs'
              />
            </div>
          </div>
          <Button
            variant='outline'
            size='sm'
            className='w-full h-7 text-xs'
            onClick={handleApplyFilter}
            disabled={isLoading}
          >
            <RefreshCw className={`h-3 w-3 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Применить фильтр
          </Button>
        </div>

        <div className='flex-1 overflow-y-auto space-y-2 pr-1'>
          {isLoading ? (
            <div className='flex flex-col items-center justify-center py-12 gap-3'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary' />
              <p className='text-sm text-muted-foreground'>Загрузка водителей...</p>
            </div>
          ) : displayDrivers.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12 text-muted-foreground gap-2'>
              <User className='h-12 w-12 opacity-20' />
              <p className='font-medium'>Водители не найдены</p>
              <p className='text-sm'>Попробуйте изменить запрос</p>
            </div>
          ) : (
            displayDrivers.map(driver => {
              const isSelected = driver.id === selectedDriverId;
              return (
                <div
                  key={driver.id}
                  className={`group relative rounded-xl border p-4 cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'hover:border-gray-300 hover:bg-gray-50/80 hover:shadow-sm'
                  }`}
                  onClick={() => handleSelect(driver)}
                >
                  <div className='flex items-center gap-4'>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {driver.fullName?.charAt(0)?.toUpperCase() ?? 'D'}
                    </div>

                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2 flex-wrap'>
                        <p className='font-semibold text-sm'>{driver.fullName}</p>
                        <Badge
                          variant={driver.online ? 'default' : 'secondary'}
                          className='text-xs px-1.5 py-0'
                        >
                          {driver.online ? 'Онлайн' : 'Офлайн'}
                        </Badge>
                        {driver.activeRideStatus && (
                          <span className={`inline-flex items-center text-xs font-medium px-1.5 py-0 rounded-full ${
                            driver.activeRideStatus === 'Arrived'
                              ? 'bg-green-100 text-green-700'
                              : driver.activeRideStatus === 'InProgress'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-100 text-slate-600'
                          }`}>
                            {driver.activeRideStatus === 'Arrived' && 'Прибыл'}
                            {driver.activeRideStatus === 'InProgress' && 'В пути'}
                            {driver.activeRideStatus === 'Paused' && 'Пауза'}
                          </span>
                        )}
                      </div>

                      <div className='flex flex-wrap gap-x-4 gap-y-0.5 mt-1'>
                        {driver.phoneNumber && (
                          <span className='flex items-center gap-1 text-xs text-muted-foreground'>
                            <Phone className='h-3 w-3' />
                            {driver.phoneNumber}
                          </span>
                        )}
                        {driver.activeCar && (
                          <span className='flex items-center gap-1 text-xs text-muted-foreground ml-3'>
                            <Car className='h-3 w-3' />
                            {driver.activeCar.make} {driver.activeCar.model} · {driver.activeCar.licensePlate}
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <div className='shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground'>
                        <svg className='h-3.5 w-3.5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={3}>
                          <path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className='flex items-center justify-between pt-3 border-t'>
          <p className='text-xs text-muted-foreground'>
            {displayDrivers.length > 0 && `${displayDrivers.length} водителей`}
          </p>
          <Button variant='outline' size='sm' onClick={onClose}>
            <X className='mr-2 h-3.5 w-3.5' />
            Закрыть
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
