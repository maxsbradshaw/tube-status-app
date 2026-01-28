self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch (_) {}

  const title = payload.title || "🚇 Tube Status";
  const body = payload.body || "Update";

  event.waitUntil(self.registration.showNotification(title, { body }));
});
