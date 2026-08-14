self.addEventListener('push', (event) => {
  console.log('[SW] Push event received');
  
  let data = { title: 'Notification', body: 'You have a new notification' };

  if (event.data) {
    try {
      data = event.data.json();
      console.log('[SW] Push data:', data);
    } catch (e) {
      data.body = event.data.text();
      console.log('[SW] Push text:', data.body);
    }
  }

  const options = {
    body: data.body,
    icon: '/app-icon.svg',
    badge: '/app-icon.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
    .then(() => console.log('[SW] Notification shown'))
    .catch((err) => console.log('[SW] Notification error:', err))
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
