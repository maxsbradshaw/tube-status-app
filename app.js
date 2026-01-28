let registration;

async function registerServiceWorker() {
  registration = await navigator.serviceWorker.register("/sw.js");
}

async function enableNotifications() {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    alert("Notifications not allowed");
    return;
  }

  document.getElementById("test").disabled = false;
}

document.getElementById("enable").onclick = async () => {
  await registerServiceWorker();
  await enableNotifications();
};

document.getElementById("test").onclick = () => {
  registration.showNotification("🚇 Tube Status", {
    body: "Northern Line: Good Service"
  });
};
