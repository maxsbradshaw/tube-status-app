let registration;

// ✅ Put your Supabase function URL here
const STATUS_URL =
  "https://kmjotlvmewrrswzooayg.supabase.co/functions/v1/get-line-status?line=";

async function registerServiceWorker() {
  registration = await navigator.serviceWorker.register("/sw.js");
}

// Ask iOS for notification permission
async function enableNotifications() {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    alert("Notifications not allowed");
    return false;
  }
  return true;
}

// Fetch live status from your backend
async function fetchLineStatus(line) {
  const res = await fetch(`${STATUS_URL}${encodeURIComponent(line)}`);
  if (!res.ok) throw new Error(`Status fetch failed: ${res.status}`);
  const data = await res.json();
  return data.message || "Status unavailable";
}

document.getElementById("enable").onclick = async () => {
  await registerServiceWorker();
  const ok = await enableNotifications();
  if (ok) document.getElementById("test").disabled = false;
};

document.getElementById("test").onclick = async () => {
  try {
    // hardcoded for now; we’ll replace with a dropdown next
    const line = "northern";
    const message = await fetchLineStatus(line);

    registration.showNotification("🚇 Tube Status", {
      body: message,
    });
  } catch (e) {
    alert(`Could not fetch status: ${e.message}`);
  }
};
