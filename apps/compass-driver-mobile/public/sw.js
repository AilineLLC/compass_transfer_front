// Service Worker для Compass Driver
// Задача: обработать клик по уведомлению → открыть/сфокусировать приложение

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(clients.claim()));

// Клик по уведомлению — открываем или фокусируем вкладку
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Фокусируем уже открытую вкладку
        for (const client of clientList) {
          if ('focus' in client) return client.focus();
        }
        // Открываем новую если не нашли
        if (clients.openWindow) return clients.openWindow('/');
      }),
  );
});
