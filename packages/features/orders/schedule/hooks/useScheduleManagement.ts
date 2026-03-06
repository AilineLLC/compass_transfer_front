'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from '@shared/lib/conditional-toast';

interface UseScheduleManagementParams {
  initialScheduledTime?: string;
  onScheduleChange?: (scheduledTime: string) => void;
  onValidityChange?: (isValid: boolean) => void;
}

interface UseScheduleManagementResult {
  selectedDate: Date | undefined;
  selectedTime: string | null;
  selectedHour: number;
  selectedMinute: number;
  handleDateSelect: (date: Date | undefined) => void;
  handleTimeChange: (hour: number, minute: number) => void;
  isTimeDisabled: (hour: number, minute: number) => boolean;
}

/**
 * Хук для управления выбором даты и времени для расписания заказа
 */
export function useScheduleManagement({
  initialScheduledTime,
  onScheduleChange,
  onValidityChange,
}: UseScheduleManagementParams): UseScheduleManagementResult {
  const getInitialTime = () => {
    const now = new Date();
    const minAllowedTime = new Date(now.getTime() + 5 * 60 * 1000);

    const minutes = Math.ceil(minAllowedTime.getMinutes() / 5) * 5;
    let hours = minAllowedTime.getHours();

    if (minutes >= 60) {
      hours += 1;

      return { hour: hours, minute: 0 };
    }

    return { hour: hours, minute: minutes };
  };

  const getInitialValues = () => {
    if (initialScheduledTime) {
      const dateTime = new Date(initialScheduledTime);
      const timeString = `${dateTime.getHours().toString().padStart(2, '0')}:${dateTime.getMinutes().toString().padStart(2, '0')}`;

      return {
        date: dateTime,
        hour: dateTime.getHours(),
        minute: dateTime.getMinutes(),
        time: timeString,
      };
    } else {
      const defaultTime = getInitialTime();
      const timeString = `${defaultTime.hour.toString().padStart(2, '0')}:${defaultTime.minute.toString().padStart(2, '0')}`;

      return {
        date: new Date(),
        hour: defaultTime.hour,
        minute: defaultTime.minute,
        time: timeString,
      };
    }
  };

  const initialValues = getInitialValues();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialValues.date);
  const [selectedTime, setSelectedTime] = useState<string | null>(initialValues.time);
  const [selectedHour, setSelectedHour] = useState<number>(initialValues.hour);
  const [selectedMinute, setSelectedMinute] = useState<number>(initialValues.minute);

  // Инициализируем состояние валидности при первой загрузке
  useEffect(() => {
    // Используем отдельную функцию, чтобы избежать повторных вызовов useEffect
    const initializeValidity = () => {
      // Проверяем валидность начальных значений
      if (initialScheduledTime) {
        if (onValidityChange) {
          onValidityChange(true);
        }
      } else if (selectedDate && selectedTime) {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const scheduledTimeString = `${year}-${month}-${day}T${selectedTime}`;

        // Проверяем, что выбранное время валидно
        const selectedDateTime = new Date(scheduledTimeString);
        const now = new Date();
        const minAllowedTime = new Date(now.getTime() + 1 * 60 * 1000);

        if (selectedDateTime > minAllowedTime && onValidityChange) {
          onValidityChange(true);
          if (onScheduleChange) {
            onScheduleChange(scheduledTimeString);
          }
        }
      }
    };

    // Вызываем функцию инициализации один раз при загрузке
    initializeValidity();
  }, []);

  const isTimeDisabled = (hour: number, minute: number): boolean => {
    if (!selectedDate) return false;

    const now = new Date();
    const minAllowedTime = new Date(now.getTime() + 1 * 60 * 1000);
    const selectedDateTime = new Date(selectedDate);

    selectedDateTime.setHours(hour, minute, 0, 0);

    const today = new Date();

    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(selectedDate);

    checkDate.setHours(0, 0, 0, 0);

    if (checkDate.getTime() === today.getTime() && selectedDateTime < minAllowedTime) {
      return true;
    }

    return false;
  };

  const updateScheduledTime = useCallback((date: Date | undefined, time: string | null) => {
    if (onScheduleChange && date && time) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const scheduledTimeString = `${year}-${month}-${day}T${time}`;

      const selectedDateTime = new Date(scheduledTimeString);
      const now = new Date();
      const minAllowedTime = new Date(now.getTime() + 1 * 60 * 1000);

      if (selectedDateTime < minAllowedTime) {
        toast.error('Время в прошлом', {
          description: 'Выберите время минимум через 1 минуту от текущего времени'
        });

        if (onValidityChange) {
          onValidityChange(false);
        }

        return;
      }

      if (onValidityChange) {
        onValidityChange(true);
      }

      onScheduleChange(scheduledTimeString);
    } else {
      if (onScheduleChange) {
        onScheduleChange('');
      }

      if (onValidityChange) {
        onValidityChange(false);
      }
    }
  }, [onScheduleChange, onValidityChange]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);

      const today = new Date();

      today.setHours(0, 0, 0, 0);
      const checkDate = new Date(date);

      checkDate.setHours(0, 0, 0, 0);

      if (checkDate.getTime() > today.getTime() && isTimeDisabled(selectedHour, selectedMinute)) {
        setSelectedHour(12);
        setSelectedMinute(0);
        const timeString = '12:00';

        setSelectedTime(timeString);
        updateScheduledTime(date, timeString);
      } else {
        updateScheduledTime(date, selectedTime);
      }
    } else {
      setSelectedDate(undefined);
      updateScheduledTime(undefined, null);
    }
  };

  const handleTimeChange = (hour: number, minute: number) => {
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

    setSelectedHour(hour);
    setSelectedMinute(minute);
    setSelectedTime(timeString);
    updateScheduledTime(selectedDate, timeString);
  };

  useEffect(() => {
    if (initialScheduledTime) {
      const dateTime = new Date(initialScheduledTime);
      const timeString = `${dateTime.getHours().toString().padStart(2, '0')}:${dateTime.getMinutes().toString().padStart(2, '0')}`;

      setSelectedDate(dateTime);
      setSelectedTime(timeString);
      setSelectedHour(dateTime.getHours());
      setSelectedMinute(dateTime.getMinutes());
    }
  }, [initialScheduledTime]);

  return {
    selectedDate,
    selectedTime,
    selectedHour,
    selectedMinute,
    handleDateSelect,
    handleTimeChange,
    isTimeDisabled,
  };
}
