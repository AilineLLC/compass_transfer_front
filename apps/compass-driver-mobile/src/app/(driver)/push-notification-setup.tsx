'use client';

import { useEffect, useRef } from 'react';
import { usePushNotifications } from '@features/notifications/hooks/usePushNotifications';

/**
 * Регистрирует Service Worker и запрашивает разрешение на уведомления.
 * SW нужен чтобы клик по уведомлению фокусировал вкладку.
 * Разрешение запрашивается при первом касании экрана (требование браузера).
 */
export function PushNotificationSetup() {
  const { isSupported, permission, requestPermission } = usePushNotifications();
  const done = useRef(false);

  useEffect(() => {
    if (!isSupported || permission === 'granted' || permission === 'denied' || done.current) return;

    done.current = true;

    // Запрашиваем разрешение при первом касании — браузер требует user gesture
    const ask = () => {
      document.removeEventListener('click', ask);
      document.removeEventListener('touchstart', ask);
      requestPermission();
    };

    document.addEventListener('click', ask, { once: true });
    document.addEventListener('touchstart', ask, { once: true });

    return () => {
      document.removeEventListener('click', ask);
      document.removeEventListener('touchstart', ask);
    };
  }, [isSupported, permission, requestPermission]);

  return null;
}
