'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  orderId?: string;
}

interface UsePushNotificationsReturn {
  isSupported: boolean;
  permission: NotificationPermission;
  /** Показать нативное уведомление (когда вкладка свёрнута, но браузер открыт) */
  showLocalNotification: (payload: PushNotificationPayload) => Promise<void>;
  /** Запросить разрешение на уведомления */
  requestPermission: () => Promise<NotificationPermission>;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const supported = 'serviceWorker' in navigator && 'Notification' in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/', updateViaCache: 'none' })
        .then((reg) => {
          swRegistrationRef.current = reg;
        })
        .catch(() => {
          // SW не зарегистрировался — показ уведомлений через fallback
        });
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) return 'denied';
    if (Notification.permission !== 'default') return Notification.permission;

    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, []);

  const showLocalNotification = useCallback(
    async (payload: PushNotificationPayload): Promise<void> => {
      if (!('Notification' in window)) return;

      let perm = Notification.permission;

      if (perm === 'default') {
        perm = await Notification.requestPermission();
        setPermission(perm);
      }

      if (perm !== 'granted') return;

      const options: NotificationOptions = {
        body: payload.body,
        icon: payload.icon ?? '/order/order.png',
        badge: '/order/order.png',
        tag: payload.tag ?? 'incoming-order',
        requireInteraction: true,
        data: { orderId: payload.orderId, url: '/' },
      };

      // Через SW — клик будет обработан в sw.js (фокус вкладки)
      const reg = swRegistrationRef.current ?? (await navigator.serviceWorker.ready.catch(() => null));

      if (reg) {
        await reg.showNotification(payload.title, options);
      } else {
        // Fallback: обычный Notification (клик просто закроет уведомление)
        new Notification(payload.title, options);
      }
    },
    [],
  );

  return { isSupported, permission, showLocalNotification, requestPermission };
}
