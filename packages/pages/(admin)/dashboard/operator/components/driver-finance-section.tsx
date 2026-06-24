'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Banknote,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  TrendingUp,
  User,
  Wallet,
  X,
} from 'lucide-react';
import { analyticsApi, type DriverPayoutItem, type DriverAnalytics } from '@shared/api/analytics';
import { Badge } from '@shared/ui/data-display/badge';
import { Button } from '@shared/ui/forms/button';
import { Input } from '@shared/ui/forms/input';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/layout';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/modals/dialog';
import { useUsdRate } from '@shared/hooks';
import { formatPriceWithUsd } from '@shared/utils/format-price-with-usd';

const PAGE_SIZE = 15;

function DriverDetailModal({
  driver,
  isOpen,
  onClose,
}: {
  driver: DriverPayoutItem | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [analytics, setAnalytics] = useState<DriverAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const usdRate = useUsdRate();
  const router = useRouter();

  useEffect(() => {
    if (!isOpen || !driver) return;

    const load = async () => {
      setLoading(true);
      setAnalytics(null);
      try {
        const data = await analyticsApi.getDriverAnalytics(driver.id);
        setAnalytics(data);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [driver, isOpen]);

  if (!driver) return null;

  const stats = [
    { label: 'Общий доход', value: analytics ? formatPriceWithUsd(analytics.totalRevenue, usdRate) : '—' },
    { label: 'За месяц', value: analytics ? formatPriceWithUsd(analytics.monthlyRevenue, usdRate) : '—' },
    { label: 'Среднее за заказ', value: analytics ? formatPriceWithUsd(analytics.averageRevenue, usdRate) : '—' },
    { label: 'Всего поездок', value: analytics ? String(analytics.totalRides) : '—' },
    { label: 'Общий пробег', value: analytics ? `${analytics.totalMileage} км` : '—' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <User className='h-5 w-5' />
            {driver.fullName || 'Без имени'}
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Pending payout */}
          <div className='flex items-center justify-between p-4 rounded-xl bg-orange-50 border border-orange-200'>
            <div>
              <p className='text-xs text-orange-600 font-medium uppercase tracking-wide'>К выплате</p>
              <p className='text-2xl font-bold text-orange-700'>
                {formatPriceWithUsd(driver.pendingPayout, usdRate)}
              </p>
            </div>
            <div className='text-right'>
              <p className='text-xs text-orange-600 font-medium uppercase tracking-wide'>Заказов</p>
              <p className='text-2xl font-bold text-orange-700'>{driver.pendingPayoutCount}</p>
            </div>
          </div>

          {/* Contact */}
          {(driver.phoneNumber || driver.email) && (
            <div className='text-sm text-muted-foreground space-y-1'>
              {driver.phoneNumber && <p>Телефон: <span className='text-foreground font-medium'>{driver.phoneNumber}</span></p>}
              {driver.email && <p>Email: <span className='text-foreground font-medium'>{driver.email}</span></p>}
            </div>
          )}

          {/* Analytics stats */}
          {loading ? (
            <div className='flex justify-center py-6'>
              <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
            </div>
          ) : (
            <div className='grid grid-cols-2 gap-3'>
              {stats.map(s => (
                <div key={s.label} className='p-3 rounded-lg bg-muted/50 space-y-1'>
                  <p className='text-xs text-muted-foreground'>{s.label}</p>
                  <p className='text-sm font-semibold'>{s.value}</p>
                </div>
              ))}
            </div>
          )}

          <Button
            className='w-full'
            variant='outline'
            onClick={() => { router.push(`/users/driver/${driver.id}`); onClose(); }}
          >
            Открыть профиль водителя
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function DriverFinanceSection() {
  const [drivers, setDrivers] = useState<DriverPayoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [after, setAfter] = useState<string | undefined>(undefined);
  const [cursorStack, setCursorStack] = useState<(string | undefined)[]>([]);
  const [hasNext, setHasNext] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedDriver, setSelectedDriver] = useState<DriverPayoutItem | null>(null);
  const usdRate = useUsdRate();

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async (cursor?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await analyticsApi.getDriversPayout({
        size: PAGE_SIZE,
        after: cursor,
        search: debouncedSearch || undefined,
      });
      setDrivers(res.data);
      setTotalCount(res.totalCount);
      setHasNext(res.hasNext);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  // Reload when search changes — reset pagination
  useEffect(() => {
    setAfter(undefined);
    setCursorStack([]);
    load(undefined);
  }, [debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNext = () => {
    const lastId = drivers[drivers.length - 1]?.id;
    setCursorStack(s => [...s, after]);
    setAfter(lastId);
    load(lastId);
  };

  const handlePrev = () => {
    const stack = [...cursorStack];
    const prev = stack.pop();
    setCursorStack(stack);
    setAfter(prev);
    load(prev);
  };

  const totalPending = drivers.reduce((s, d) => s + d.pendingPayout, 0);
  const page = cursorStack.length + 1;

  return (
    <div className='px-4 pb-6 space-y-4'>
      {/* Заголовок + итог */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Wallet className='h-5 w-5 text-primary' />
          <h2 className='text-xl font-semibold'>Финансы — выплаты водителям</h2>
        </div>
        {!loading && totalCount > 0 && (
          <Badge variant='outline' className='text-sm'>
            Всего: {totalCount} водителей
          </Badge>
        )}
      </div>

      {/* Суммарная карточка */}
      {!loading && drivers.length > 0 && (
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
          <Card className='border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100/50'>
            <CardContent className='pt-4 pb-4 flex items-center gap-3'>
              <div className='p-2 rounded-lg bg-orange-100'>
                <Banknote className='h-5 w-5 text-orange-600' />
              </div>
              <div>
                <p className='text-xs text-orange-600 font-medium'>К выплате (страница)</p>
                <p className='text-lg font-bold text-orange-700'>{formatPriceWithUsd(totalPending, usdRate)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className='border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50'>
            <CardContent className='pt-4 pb-4 flex items-center gap-3'>
              <div className='p-2 rounded-lg bg-blue-100'>
                <TrendingUp className='h-5 w-5 text-blue-600' />
              </div>
              <div>
                <p className='text-xs text-blue-600 font-medium'>Водителей с долгом</p>
                <p className='text-lg font-bold text-blue-700'>{drivers.filter(d => d.pendingPayout > 0).length} / {drivers.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Поиск */}
      <div className='relative'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
        <Input
          placeholder='Поиск по имени или телефону...'
          value={search}
          onChange={e => setSearch(e.target.value)}
          className='pl-9 pr-9'
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
          >
            <X className='h-4 w-4' />
          </button>
        )}
      </div>

      {/* Таблица */}
      <Card>
        <CardHeader className='pb-2 pt-4 px-4'>
          <CardTitle className='text-sm font-medium text-muted-foreground'>
            Список водителей
          </CardTitle>
        </CardHeader>
        <CardContent className='p-0'>
          {loading ? (
            <div className='flex justify-center py-12'>
              <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
            </div>
          ) : error ? (
            <div className='text-center py-12 text-sm text-red-500'>{error}</div>
          ) : drivers.length === 0 ? (
            <div className='text-center py-12 text-sm text-muted-foreground'>
              Нет данных о выплатах
            </div>
          ) : (
            <div className='divide-y'>
              {drivers.map(driver => (
                <button
                  key={driver.id}
                  onClick={() => setSelectedDriver(driver)}
                  className='w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors text-left'
                >
                  <div className='flex items-center gap-3 min-w-0'>
                    <div className='w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0'>
                      <User className='h-4 w-4 text-primary' />
                    </div>
                    <div className='min-w-0'>
                      <p className='font-medium text-sm truncate'>
                        {driver.fullName || <span className='text-muted-foreground italic'>Без имени</span>}
                      </p>
                      <p className='text-xs text-muted-foreground truncate'>
                        {driver.phoneNumber || driver.email || driver.id.slice(0, 8) + '…'}
                      </p>
                    </div>
                  </div>

                  <div className='flex items-center gap-4 flex-shrink-0 ml-4'>
                    <div className='text-right'>
                      <p className='text-xs text-muted-foreground'>Заказов</p>
                      <p className='text-sm font-semibold'>{driver.pendingPayoutCount}</p>
                    </div>
                    <div className='text-right'>
                      <p className='text-xs text-muted-foreground'>К выплате</p>
                      <p className={`text-sm font-bold ${driver.pendingPayout > 0 ? 'text-orange-600' : 'text-muted-foreground'}`}>
                        {driver.pendingPayout > 0
                          ? formatPriceWithUsd(driver.pendingPayout, usdRate)
                          : '—'}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Пагинация */}
      {(cursorStack.length > 0 || hasNext) && (
        <div className='flex items-center justify-between text-sm text-muted-foreground'>
          <Button
            variant='outline'
            size='sm'
            onClick={handlePrev}
            disabled={cursorStack.length === 0 || loading}
            className='gap-1'
          >
            <ChevronLeft className='h-4 w-4' />
            Назад
          </Button>
          <span>Страница {page}</span>
          <Button
            variant='outline'
            size='sm'
            onClick={handleNext}
            disabled={!hasNext || loading}
            className='gap-1'
          >
            Вперёд
            <ChevronRight className='h-4 w-4' />
          </Button>
        </div>
      )}

      {/* Модальное окно деталей водителя */}
      <DriverDetailModal
        driver={selectedDriver}
        isOpen={!!selectedDriver}
        onClose={() => setSelectedDriver(null)}
      />
    </div>
  );
}
