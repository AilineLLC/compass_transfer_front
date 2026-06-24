'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Banknote,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Loader2,
  Search,
  TrendingUp,
  User,
  Wallet,
  X,
} from 'lucide-react';
import { analyticsApi, type DriverPayoutItem, type DriverAnalytics, type DriversPayoutFilters } from '@shared/api/analytics';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui/forms/select';
import { useUsdRate } from '@shared/hooks';
import { formatPriceWithUsd } from '@shared/utils/format-price-with-usd';

const PAGE_SIZE = 20;

const SORT_BY_OPTIONS = [
  { value: 'PendingPayout', label: 'Сумма к выплате' },
  { value: 'PendingPayoutCount', label: 'Кол-во заказов' },
  { value: 'FullName', label: 'Имя' },
];

// ---------- Driver detail modal ----------

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
    setLoading(true);
    setAnalytics(null);
    analyticsApi
      .getDriverAnalytics(driver.id)
      .then(setAnalytics)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [driver, isOpen]);

  if (!driver) return null;

  const stats: { label: string; value: string }[] = [
    { label: 'Общий доход', value: analytics ? formatPriceWithUsd(analytics.totalRevenue, usdRate) : '—' },
    { label: 'За этот месяц', value: analytics ? formatPriceWithUsd(analytics.monthlyRevenue, usdRate) : '—' },
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

          {(driver.phoneNumber || driver.email) && (
            <div className='text-sm space-y-1'>
              {driver.phoneNumber && (
                <p className='text-muted-foreground'>
                  Телефон: <span className='text-foreground font-medium'>{driver.phoneNumber}</span>
                </p>
              )}
              {driver.email && (
                <p className='text-muted-foreground'>
                  Email: <span className='text-foreground font-medium'>{driver.email}</span>
                </p>
              )}
            </div>
          )}

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
            onClick={() => {
              router.push(`/users/driver/${driver.id}`);
              onClose();
            }}
          >
            Открыть профиль водителя
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Main page ----------

interface Filters {
  sortBy: string;
  sortOrder: 'Asc' | 'Desc';
}

const DEFAULT_FILTERS: Filters = {
  sortBy: 'PendingPayout',
  sortOrder: 'Desc',
};

export function FinancesPage() {
  const [drivers, setDrivers] = useState<DriverPayoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [cursorStack, setCursorStack] = useState<(string | undefined)[]>([]);
  const [after, setAfter] = useState<string | undefined>(undefined);
  const [hasNext, setHasNext] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedDriver, setSelectedDriver] = useState<DriverPayoutItem | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const usdRate = useUsdRate();

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const buildApiFilters = useCallback((cursor?: string): DriversPayoutFilters => ({
    size: PAGE_SIZE,
    after: cursor,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  }), [filters]);

  const load = useCallback(async (cursor?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await analyticsApi.getDriversPayout(buildApiFilters(cursor));
      setDrivers(res.data);
      setTotalCount(res.totalCount);
      setHasNext(res.hasNext);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }, [buildApiFilters]);

  // reset pagination and reload on filter/search change
  useEffect(() => {
    setAfter(undefined);
    setCursorStack([]);
    load(undefined);
  }, [debouncedSearch, filters]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters(f => ({ ...f, [key]: value }));
  };

  const totalPending = drivers.reduce((s, d) => s + d.pendingPayout, 0);
  const driversWithDebt = drivers.filter(d => d.pendingPayout > 0).length;
  const page = cursorStack.length + 1;

  return (
    <div className='h-full flex flex-col border rounded-2xl bg-white overflow-hidden'>
      {/* Шапка */}
      <div className='flex items-center justify-between px-6 py-4 border-b flex-shrink-0'>
        <div className='flex items-center gap-2'>
          <Wallet className='h-5 w-5 text-primary' />
          <h1 className='text-xl font-semibold'>Финансы — выплаты водителям</h1>
        </div>
        {!loading && totalCount > 0 && (
          <Badge variant='outline'>Всего: {totalCount}</Badge>
        )}
      </div>

      <div className='flex-1 overflow-y-auto'>
        <div className='p-6 space-y-4'>

          {/* Сводные карточки */}
          {!loading && drivers.length > 0 && (
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
              <Card className='border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100/40'>
                <CardContent className='pt-4 pb-4 flex items-center gap-3'>
                  <div className='p-2 rounded-lg bg-orange-100'>
                    <Banknote className='h-5 w-5 text-orange-600' />
                  </div>
                  <div>
                    <p className='text-xs text-orange-600 font-medium'>К выплате (страница)</p>
                    <p className='text-lg font-bold text-orange-700'>
                      {formatPriceWithUsd(totalPending, usdRate)}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className='border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/40'>
                <CardContent className='pt-4 pb-4 flex items-center gap-3'>
                  <div className='p-2 rounded-lg bg-blue-100'>
                    <TrendingUp className='h-5 w-5 text-blue-600' />
                  </div>
                  <div>
                    <p className='text-xs text-blue-600 font-medium'>С задолженностью</p>
                    <p className='text-lg font-bold text-blue-700'>
                      {driversWithDebt} / {drivers.length}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className='border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100/40'>
                <CardContent className='pt-4 pb-4 flex items-center gap-3'>
                  <div className='p-2 rounded-lg bg-gray-100'>
                    <User className='h-5 w-5 text-gray-600' />
                  </div>
                  <div>
                    <p className='text-xs text-gray-600 font-medium'>Страница</p>
                    <p className='text-lg font-bold text-gray-700'>{page}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Поиск + сортировка */}
          <div className='flex gap-2 items-center'>
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Поиск по имени, телефону...'
                value={search}
                onChange={e => setSearch(e.target.value)}
                className='pl-9 pr-9 h-9'
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

            <Select
              value={filters.sortBy}
              onValueChange={v => setFilter('sortBy', v)}
            >
              <SelectTrigger className='w-44 h-9 shrink-0'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_BY_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant='outline'
              size='sm'
              className='h-9 gap-1.5 shrink-0'
              onClick={() => setFilter('sortOrder', filters.sortOrder === 'Asc' ? 'Desc' : 'Asc')}
            >
              {filters.sortOrder === 'Asc' ? (
                <><ChevronUp className='h-4 w-4' />По возрастанию</>
              ) : (
                <><ChevronDown className='h-4 w-4' />По убыванию</>
              )}
            </Button>
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
                <div className='flex justify-center py-16'>
                  <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
                </div>
              ) : error ? (
                <div className='text-center py-16 text-sm text-red-500'>{error}</div>
              ) : drivers.length === 0 ? (
                <div className='text-center py-16 text-sm text-muted-foreground'>
                  Нет данных о выплатах
                </div>
              ) : (
                <div className='divide-y'>
                  <div className='grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-2 bg-muted/40 text-xs text-muted-foreground font-medium'>
                    <span>Водитель</span>
                    <span className='text-right w-20'>Заказов</span>
                    <span className='text-right w-36'>К выплате</span>
                  </div>

                  {drivers.map(driver => (
                    <button
                      key={driver.id}
                      onClick={() => setSelectedDriver(driver)}
                      className='w-full grid grid-cols-[1fr_auto_auto] gap-4 items-center px-4 py-3 hover:bg-muted/40 transition-colors text-left'
                    >
                      <div className='flex items-center gap-3 min-w-0'>
                        <div className='w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0'>
                          <User className='h-4 w-4 text-primary' />
                        </div>
                        <div className='min-w-0'>
                          <p className='text-sm font-medium truncate'>
                            {driver.fullName || (
                              <span className='text-muted-foreground italic'>Без имени</span>
                            )}
                          </p>
                          <p className='text-xs text-muted-foreground truncate'>
                            {driver.phoneNumber || driver.email || driver.id.slice(0, 8) + '…'}
                          </p>
                        </div>
                      </div>
                      <span className='text-sm font-semibold text-right w-20'>
                        {driver.pendingPayoutCount}
                      </span>
                      <span
                        className={`text-sm font-bold text-right w-36 ${
                          driver.pendingPayout > 0 ? 'text-orange-600' : 'text-muted-foreground'
                        }`}
                      >
                        {driver.pendingPayout > 0
                          ? formatPriceWithUsd(driver.pendingPayout, usdRate)
                          : '—'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Пагинация */}
          {(cursorStack.length > 0 || hasNext) && (
            <div className='flex items-center justify-between'>
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
              <span className='text-sm text-muted-foreground'>Страница {page}</span>
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

        </div>
      </div>

      <DriverDetailModal
        driver={selectedDriver}
        isOpen={!!selectedDriver}
        onClose={() => setSelectedDriver(null)}
      />
    </div>
  );
}
