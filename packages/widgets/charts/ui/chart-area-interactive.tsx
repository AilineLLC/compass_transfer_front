'use client';

import React from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, type ChartConfig } from '@shared/ui/data-display/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui/forms/select';
import { DatePicker } from '@shared/ui/forms/date-picker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/layout/card';
import { chartData } from '@entities/charts';

const chartConfig = {
  visitors: {
    label: 'Visitors',
  },
  desktop: {
    label: 'Desktop',
    color: 'var(--chart-1)',
  },
  mobile: {
    label: 'Mobile',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig;

export function ChartAreaInteractive() {
  const [timeRange, setTimeRange] = React.useState<string>('all');
  const [dateFrom, setDateFrom] = React.useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = React.useState<Date | undefined>(undefined);

  const filteredData = React.useMemo(() => {
    if (timeRange === 'all') {
      return chartData;
    }

    let startDate: Date;
    let endDate: Date;

    if (timeRange === 'custom') {
      if (!dateFrom || !dateTo) {
        return chartData;
      }
      startDate = new Date(dateFrom);
      endDate = new Date(dateTo);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else {
      const lastDate = new Date('2024-04-30');
      let daysToSubtract = 90;

      if (timeRange === '30d') {
        daysToSubtract = 30;
      } else if (timeRange === '7d') {
        daysToSubtract = 7;
      }

      startDate = new Date(lastDate);
      startDate.setDate(startDate.getDate() - daysToSubtract);
      endDate = new Date(lastDate);
    }

    const filtered = chartData.filter(item => {
      const date = new Date(item.date);

      return date >= startDate && date <= endDate;
    });

    return filtered;
  }, [timeRange, dateFrom, dateTo]);

  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value);
    if (value !== 'custom') {
      setDateFrom(undefined);
      setDateTo(undefined);
    }
  };

  const handleDateFromChange = (date: Date | undefined) => {
    setDateFrom(date);
    if (date && dateTo && date > dateTo) {
      setDateTo(undefined);
    }
  };

  const handleDateToChange = (date: Date | undefined) => {
    setDateTo(date);
    if (date && dateFrom && date < dateFrom) {
      setDateFrom(undefined);
    }
  };


  return (
    <Card>
      <CardHeader
        className={`flex gap-2 border-b py-5 ${
          timeRange === 'custom' ? 'flex-col lg:flex-row lg:items-center' : 'flex-row items-center'
        }`}
      >
        <div className='grid flex-1 gap-1 text-center sm:text-left'>
          <CardTitle>Количество заказов по дням</CardTitle>
          <CardDescription>График заказов за выбранный период</CardDescription>
        </div>
        <div
          className={`flex items-center gap-2 ${
            timeRange === 'custom' ? 'w-full flex-wrap lg:w-auto lg:flex-nowrap' : ''
          }`}
        >
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className='w-[160px] flex-shrink-0 rounded-lg lg:ml-auto' aria-label='Select a value'>
              <SelectValue placeholder='Выберите период' />
            </SelectTrigger>
            <SelectContent className='rounded-xl'>
              <SelectItem value='all' className='rounded-lg'>
                Всё время
              </SelectItem>
              <SelectItem value='90d' className='rounded-lg'>
                Последние 3 месяца
              </SelectItem>
              <SelectItem value='30d' className='rounded-lg'>
                Последние 30 дней
              </SelectItem>
              <SelectItem value='7d' className='rounded-lg'>
                Последние 7 дней
              </SelectItem>
              <SelectItem value='custom' className='rounded-lg'>
                Выбрать даты
              </SelectItem>
            </SelectContent>
          </Select>
          {timeRange === 'custom' && (
            <div className='flex items-center gap-2 w-full min-w-0 lg:w-auto lg:flex-initial'>
              <DatePicker
                value={dateFrom}
                onChange={handleDateFromChange}
                placeholder='От (дата начала)'
                className='min-w-0 flex-1 lg:w-[160px] lg:flex-none'
              />
              <span className='text-muted-foreground flex-shrink-0'>—</span>
              <DatePicker
                value={dateTo}
                onChange={handleDateToChange}
                placeholder='До (дата окончания)'
                className='min-w-0 flex-1 lg:w-[160px] lg:flex-none'
              />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className='px-0 pt-4 sm:px-0 sm:pt-6'>
        <ChartContainer
          config={chartConfig}
          className='aspect-auto h-[250px] w-full'
          style={
            {
              '--color-desktop': 'var(--chart-1)',
              '--color-mobile': 'var(--chart-2)',
            } as React.CSSProperties
          }
        >
          <ResponsiveContainer width='100%' height='100%'>
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id='fillDesktop' x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='5%' stopColor='var(--color-desktop)' stopOpacity={1.0} />
                  <stop offset='95%' stopColor='var(--color-desktop)' stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id='fillMobile' x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='5%' stopColor='var(--color-mobile)' stopOpacity={0.8} />
                  <stop offset='95%' stopColor='var(--color-mobile)' stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey='date'
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value: string) => {
                  const date = new Date(value);

                  return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  });
                }}
              />
              <Tooltip
                cursor={false}
                labelFormatter={(value: string) => {
                  return new Date(value).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  });
                }}
              />
              <Area
                dataKey='mobile'
                type='natural'
                fill='url(#fillMobile)'
                stroke='var(--color-mobile)'
                stackId='a'
              />
              <Area
                dataKey='desktop'
                type='natural'
                fill='url(#fillDesktop)'
                stroke='var(--color-desktop)'
                stackId='a'
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
