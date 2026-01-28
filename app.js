let registration;

// Your Supabase endpoints
const SAVE_URL =
  "https://kmjotlvmewrrswzooayg.supabase.co/functions/v1/save-subscription";

// VAPID public key (from secrets → but you need it in the frontend)
const VAPID_PUBLIC_KEY = "BKM02271RwNzLQj7-CF9DxQIVfTCgLSxnJ0edL0_BpFCvMI70mrTax9lybBW8j95AzPu4TMFR-w9QA2CnxV6PkQ";

const DELETE_URL =
  "https://kmjotlvmewrrswzooayg.supabase.co/functions/v1/delete-subscription";

// Helper: base64url -> Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

async function registerServiceWorker() {
  registration = await navigator.serviceWorker.register("/sw.js");
}

async function enableAndSubscribe() {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Notifications not allowed");

  const sub = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  return sub;
}

async function savePreferences(subscription) {
  const line = document.getElementById("line").value;
  const notify_time = document.getElementById("time").value; // "HH:MM"
  const schedule = document.getElementById("schedule").value; // off/weekdays/daily

  const res = await fetch(SAVE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      subscription,
      line,
      notify_time,
      schedule,
      timezone: "Europe/London",
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt);
  }
}

document.getElementById("enable").onclick = async () => {
  try {
    await registerServiceWorker();
    const sub = await enableAndSubscribe();
    await savePreferences(sub);

    alert("Saved! You’ll get notifications at your chosen time.");
  } catch (e) {
    alert(`Setup failed: ${e.message}`);
  }
};
