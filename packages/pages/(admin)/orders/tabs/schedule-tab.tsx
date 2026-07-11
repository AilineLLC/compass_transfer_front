'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Plane, MapPin, PlaneTakeoff, PlaneLanding } from 'lucide-react';
import { Calendar } from '@shared/ui/data-display/calendar';
import { Input } from '@shared/ui/forms/input';
import { Label } from '@shared/ui/forms/label';
import { Textarea } from '@shared/ui/forms/textarea';
import type { CreateScheduledOrderDTOType } from '@entities/orders/schemas';
import { useScheduleManagement } from '@features/orders/schedule';

type FlightType = 'departure' | 'arrival' | null;

interface ScheduleTabProps {
  onScheduleChange?: (scheduledTime: string) => void;
  onValidityChange?: (isValid: boolean) => void;
  initialScheduledTime?: string;
  methods?: {
    setValue: <K extends keyof CreateScheduledOrderDTOType>(name: K, value: CreateScheduledOrderDTOType[K]) => void;
    getValues: <K extends keyof CreateScheduledOrderDTOType>(name?: K) => K extends keyof CreateScheduledOrderDTOType ? CreateScheduledOrderDTOType[K] : Partial<CreateScheduledOrderDTOType>;
    [key: string]: unknown;
  };
}

export function ScheduleTab({ onScheduleChange, onValidityChange, initialScheduledTime, methods }: ScheduleTabProps) {
  const {
    selectedDate,
    selectedTime,
    selectedHour,
    selectedMinute,
    handleDateSelect,
    handleTimeChange,
    isTimeDisabled,
  } = useScheduleManagement({
    initialScheduledTime,
    onScheduleChange,
    onValidityChange,
  });

  const flyReis = (methods?.getValues('flyReis') as string) || '';
  const airFlight = (methods?.getValues('airFlight') as string) || '';
  const description = (methods?.getValues('description') as string) || '';

  const [flightType, setFlightType] = useState<FlightType>(() => {
    if (airFlight) return 'departure';
    if (flyReis) return 'arrival';
    return null;
  });

  useEffect(() => {
    if (flightType === null) {
      if (airFlight) setFlightType('departure');
      else if (flyReis) setFlightType('arrival');
    }
  }, [airFlight, flyReis, flightType]);

  const handleFlightTypeChange = (type: FlightType) => {
    setFlightType(type);
    if (!methods) return;
    if (type === 'departure') {
      methods.setValue('flyReis', '');
    } else if (type === 'arrival') {
      methods.setValue('airFlight', '');
    } else {
      methods.setValue('airFlight', '');
      methods.setValue('flyReis', '');
    }
  };

  const bookedDates = Array.from({ length: 3 }, (_, i) => new Date(2025, 0, 17 + i));

  return (
    <div className='flex flex-row w-full gap-4'>
      {/* Left: flight info + notes */}
      <div className='flex-[2] space-y-4'>
        <div className='space-y-2'>
          <h3 className='text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5'>
            <Plane className='h-3.5 w-3.5' />
            Рейс
          </h3>
          {/* Flight type toggle */}
          <div className='flex rounded-lg border border-gray-200 p-0.5 bg-gray-50 w-fit gap-0.5'>
            <button
              type='button'
              onClick={() => handleFlightTypeChange(null)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                flightType === null ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Не указывать
            </button>
            <button
              type='button'
              onClick={() => handleFlightTypeChange('departure')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                flightType === 'departure' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <PlaneTakeoff className='h-3 w-3' />
              Вылет
            </button>
            <button
              type='button'
              onClick={() => handleFlightTypeChange('arrival')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                flightType === 'arrival' ? 'bg-white shadow-sm text-green-700' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <PlaneLanding className='h-3 w-3' />
              Прилет
            </button>
          </div>

          {flightType === 'departure' && (
            <div className='space-y-1'>
              <Label htmlFor='air-flight' className='text-xs font-medium flex items-center gap-1'>
                <PlaneTakeoff className='h-3 w-3 text-blue-600' />
                Номер рейса вылета
              </Label>
              <Input
                id='air-flight'
                placeholder='SU 1234'
                value={airFlight}
                onChange={e => {
                  const v = e.target.value.toUpperCase().replace(/[^A-Z0-9\s-]/g, '');
                  if (methods) methods.setValue('airFlight', v);
                }}
                className='font-mono h-8 text-sm'
              />
            </div>
          )}

          {flightType === 'arrival' && (
            <div className='space-y-1'>
              <Label htmlFor='fly-reis' className='text-xs font-medium flex items-center gap-1'>
                <PlaneLanding className='h-3 w-3 text-green-600' />
                Номер рейса прилета
              </Label>
              <Input
                id='fly-reis'
                placeholder='SU 5678'
                value={flyReis}
                onChange={e => {
                  const v = e.target.value.toUpperCase().replace(/[^A-Z0-9\s-]/g, '');
                  if (methods) methods.setValue('flyReis', v);
                }}
                className='font-mono h-8 text-sm'
              />
            </div>
          )}

          {flightType === null && (
            <p className='text-xs text-gray-400 italic'>Рейс не нужен</p>
          )}
        </div>

        {/* Notes */}
        <div className='space-y-2'>
          <h3 className='text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5'>
            <MapPin className='h-3.5 w-3.5' />
            Комментарий
          </h3>
          <Textarea
            id='description'
            placeholder='Особые требования, терминал, встреча с табличкой...'
            value={description}
            onChange={e => {
              if (methods) methods.setValue('description', e.target.value);
            }}
            rows={5}
            className='resize-none text-sm'
          />
        </div>
      </div>

      {/* Right: calendar */}
      <div className='flex-[1] space-y-3'>
        <h3 className='text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5'>
          <CalendarIcon className='h-3.5 w-3.5' />
          Дата поездки
        </h3>
        <Calendar
          key={selectedDate?.toISOString() || 'no-date'}
          mode='single'
          selected={selectedDate}
          onSelect={handleDateSelect}
          defaultMonth={selectedDate}
          disabled={date => {
            const now = new Date();
            const minAllowedTime = new Date(now.getTime() + 60 * 1000);
            const today = new Date(minAllowedTime);
            today.setHours(0, 0, 0, 0);
            const checkDate = new Date(date);
            checkDate.setHours(0, 0, 0, 0);
            if (checkDate < today) return true;
            return bookedDates.some(bookedDate => {
              const d = new Date(bookedDate);
              d.setHours(0, 0, 0, 0);
              return d.getTime() === checkDate.getTime();
            });
          }}
          showOutsideDays={false}
          fixedWeeks
          modifiers={{ booked: bookedDates }}
          modifiersClassNames={{ booked: '[&>button]:line-through opacity-50' }}
          className='origin-top-left p-0'
          formatters={{ formatWeekdayName: date => date.toLocaleString('ru-RU', { weekday: 'short' }) }}
          showTimePicker={!!selectedDate}
          selectedHour={selectedHour}
          selectedMinute={selectedMinute}
          isTimeDisabled={isTimeDisabled}
          onTimeChange={handleTimeChange}
        />

        {selectedDate && selectedTime && (
          <div className='rounded-lg bg-primary/5 border border-primary/20 p-2.5'>
            <div className='flex items-center gap-2 text-xs'>
              <CalendarIcon className='h-3.5 w-3.5 text-primary flex-shrink-0' />
              <span className='text-muted-foreground'>
                {selectedDate.toLocaleDateString('ru-RU', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}{' '}
                в{' '}
                <span className='font-semibold text-primary'>{selectedTime}</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
