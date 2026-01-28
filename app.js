window.onerror = (msg, src, line, col) => {
  alert(`JS error: ${msg} @${line}:${col}`);
};

let registration;

const SUPABASE_BASE = "https://kmjotlvmewrrswzooayg.supabase.co/functions/v1";
const VAPID_URL = `${SUPABASE_BASE}/vapid-public-key`;
const SAVE_URL = `${SUPABASE_BASE}/save-subscription`;
const DELETE_URL = `${SUPABASE_BASE}/delete-subscription`;
const STATUS_URL = `${SUPABASE_BASE}/get-line-status?line=`;

function setStatus(text) {
  const el = document.getElementById("status");
  if (el) el.textContent = text;
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) throw new Error("Service workers not supported");
  registration = await navigator.serviceWorker.register("/sw.js");
}

async function getVapidPublicKey() {
  const res = await fetch(VAPID_URL);
  if (!res.ok) throw new Error("Could not fetch VAPID key");
  const data = await res.json();
  return data.publicKey;
}

async function subscribeForPush() {
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
  const notify_time = document.getElementById("time").value;      // "HH:MM"
  const schedule = document.getElementById("schedule").value;     // off/weekdays/daily

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

  const txt = await res.text();
  if (!res.ok) throw new Error(txt);
}

async function deleteSubscription(endpoint) {
  const res = await fetch(DELETE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint }),
  });

  const txt = await res.text();
  if (!res.ok) throw new Error(txt);
}

async function fetchLineStatus(line) {
  const res = await fetch(`${STATUS_URL}${encodeURIComponent(line)}`);
  if (!res.ok) throw new Error(`Status fetch failed: ${res.status}`);
  const data = await res.json();
  return data.message || "Status unavailable";
}

document.addEventListener("DOMContentLoaded", () => {
  const enableBtn = document.getElementById("enable");
  const disableBtn = document.getElementById("disable");
  const testBtn = document.getElementById("test");

  if (!enableBtn) alert("Missing #enable button");
  if (!disableBtn) alert("Missing #disable button");
  if (!testBtn) alert("Missing #test button");

enableBtn?.addEventListener("click", async () => {
  try {
    setStatus("Enabling…");

    if (!("Notification" in window)) {
      throw new Error("Notifications not supported on this device");
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      throw new Error("Notification permission denied");
    }

    await registerServiceWorker();
    const sub = await subscribeForPush();
    await savePreferences(sub);

    setStatus("Enabled ✅");
  } catch (e) {
    setStatus("");
    alert(`Enable failed: ${e.message}`);
  }
});

  disableBtn?.addEventListener("click", async () => {
    try {
      setStatus("Disabling…");
      await registerServiceWorker();

      const sub = await registration.pushManager.getSubscription();
      if (!sub) {
        setStatus("Already disabled.");
        return;
      }

      await deleteSubscription(sub.endpoint);
      await sub.unsubscribe();

      testBtn.disabled = true;
      setStatus("Disabled ✅");
    } catch (e) {
      setStatus("");
      alert(`Disable failed: ${e.message}`);
    }
  });

  testBtn?.addEventListener("click", async () => {
  try {
    const line = document.getElementById("line").value;
    setStatus("Checking…");
    const message = await fetchLineStatus(line);
    setStatus(message);
  } catch (e) {
    alert(`Check failed: ${e.message}`);
  }
});

// Install help for iOS (Add to Home Screen)
document.getElementById("installHelp")?.addEventListener("click", () => {
  alert(
    "To install Tube Status:\n\n" +
    "1) Tap the Share button (square with arrow)\n" +
    "2) Scroll and tap 'Add to Home Screen'\n" +
    "3) Open the app from your Home Screen\n\n" +
    "Tip: After installing, enable notifications inside the app."
  );
});
  
  setStatus("Ready.");
});
