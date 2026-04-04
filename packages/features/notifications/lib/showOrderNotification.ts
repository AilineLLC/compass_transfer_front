/**
 * Показывает нативное браузерное уведомление о новом заказе.
 * Вызывается когда вкладка свёрнута (document.hidden === true).
 *
 * Намеренно не запрашивает разрешение — это задача PushNotificationSetup.
 * Если разрешение не выдано, просто не показываем уведомление.
 */
export async function showOrderNotification(from: string, to: string, orderId?: string) {
  if (typeof window === 'undefined') return;
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const title = 'Новый заказ 🚖';
  const options: NotificationOptions = {
    body: `${from} → ${to}`,
    icon: '/order/order.png',
    badge: '/order/order.png',
    tag: 'incoming-order',
    requireInteraction: true,
    data: { orderId, url: '/' },
  };

  try {
    // Через SW (клик по уведомлению фокусирует вкладку)
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification(title, options);
  } catch {
    // Fallback если SW недоступен
    try {
      new Notification(title, options);
    } catch {
      // Тихо игнорируем
    }
  }
}
