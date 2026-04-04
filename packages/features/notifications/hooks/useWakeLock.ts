'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Хук блокировки засыпания экрана (Wake Lock API).
 *
 * Пока активна блокировка — телефон не уходит в спящий режим,
 * браузер остаётся активным, SignalR-соединение не обрывается.
 *
 * Поддержка: Chrome 84+, Edge 84+, Safari 16.4+, Firefox — не поддерживает.
 * На iOS требует PWA-режима (добавление на домашний экран).
 */
export function useWakeLock() {
  const [isSupported] = useState(
    () => typeof navigator !== 'undefined' && 'wakeLock' in navigator,
  );
  const [isActive, setIsActive] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // Переавтоматически пере-запрашиваем блокировку когда страница снова активна
  // (браузер сбрасывает Wake Lock при переходе в фон)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isActive) {
        acquireInternal();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isActive]);

  const acquireInternal = async () => {
    if (!isSupported) return;
    try {
      wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      setIsActive(true);

      wakeLockRef.current.addEventListener('release', () => {
        setIsActive(false);
      });
    } catch {
      // Устройство или браузер не поддерживает — тихо игнорируем
    }
  };

  /** Заблокировать засыпание экрана */
  const acquire = useCallback(async () => {
    await acquireInternal();
  }, [isSupported]);

  /** Снять блокировку */
  const release = useCallback(async () => {
    if (wakeLockRef.current) {
      await wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }
    setIsActive(false);
  }, []);

  return { isSupported, isActive, acquire, release };
}
