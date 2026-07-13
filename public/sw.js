self.addEventListener("push", function (event) {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body || "You have a new message!",
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      vibrate: [100, 50, 100],
      data: data.data || {},
    };

    event.waitUntil(
      self.registration.showNotification(data.title || "New Message", options)
    );
  } catch (err) {
    console.error("Error parsing push notification data:", err);
  }
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const notificationData = event.notification.data || {};
  const targetUrl = notificationData.url || "/chat";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      // If there is an open window/tab, navigate it and focus
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // If no windows/tabs are open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
