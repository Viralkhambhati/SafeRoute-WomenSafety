import API, { getVapidPublicKey } from "../services/api";

let vapidPublicKey = null;

export const getVapidKey = async () => {
  if (!vapidPublicKey) {
    vapidPublicKey = await getVapidPublicKey();
  }
  return vapidPublicKey;
};

export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    throw new Error("This browser does not support notifications");
  }

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    throw new Error("Notification permission denied");
  }

  return permission;
};

export const getNotificationPermission = () => {
  if (!("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
};

export const subscribeToNotifications = async () => {
  console.log("[Notification] Starting subscription...");
  
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service Worker not supported");
  }

  const publicKey = await getVapidKey();
  console.log("[Notification] VAPID public key:", publicKey ? "loaded" : "missing");

  if (!publicKey) {
    throw new Error("VAPID public key is not configured");
  }

  const registration = await navigator.serviceWorker.ready;
  console.log("[Notification] Service Worker ready:", registration);

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: publicKey,
  });

  console.log("[Notification] Push subscription created:", subscription);
  console.log("[Notification] Subscription endpoint:", subscription.endpoint);

  const response = await API.post("/notifications/subscribe", subscription);
  console.log("[Notification] Subscription saved to backend:", response.data);

  return response.data;
};

export const unsubscribeFromNotifications = async () => {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    await subscription.unsubscribe();
    await API.delete("/notifications/unsubscribe");
  }
};

export const isSubscribed = async () => {
  if (!("serviceWorker" in navigator)) {
    return false;
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  return !!subscription;
};
