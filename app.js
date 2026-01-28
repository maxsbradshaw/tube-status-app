let registration;

// Your Supabase endpoints
const SAVE_URL =
  "https://kmjotlvmewrrswzooayg.supabase.co/functions/v1/save-subscription";

// VAPID public key (from secrets → but you need it in the frontend)
const VAPID_URL =
  "https://kmjotlvmewrrswzooayg.supabase.co/functions/v1/vapid-public-key";

async function getVapidPublicKey() {
  const res = await fetch(VAPID_URL);
  if (!res.ok) throw new Error("Could not fetch VAPID public key");
  const data = await res.json();
  return data.publicKey;
}

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

  const publicKey = await getVapidPublicKey();

const sub = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: urlBase64ToUint8Array(publicKey),
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

document.getElementById("disable").onclick = async () => {
  try {
    await registerServiceWorker();

    const sub = await registration.pushManager.getSubscription();
    if (!sub) {
      alert("No active subscription found on this device.");
      return;
    }

    // Remove from backend
    const res = await fetch(DELETE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt);
    }

    // Unsubscribe locally
    await sub.unsubscribe();

    alert("Notifications disabled.");
  } catch (e) {
    alert(`Disable failed: ${e.message}`);
  }
};

