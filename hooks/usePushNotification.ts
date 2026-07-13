"use client";

import { useEffect, useState, useCallback } from "react";
import API from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export function usePushNotification() {
  const { user } = useAuth();
  const [permissionState, setPermissionState] = useState<
    "default" | "granted" | "denied" | "unsupported"
  >("default");
  const [showBanner, setShowBanner] = useState(false);

  // Check initial permission state
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPermissionState("unsupported");
      return;
    }

    setPermissionState(Notification.permission);
  }, []);

  // Control permission opt-in banner visibility
  useEffect(() => {
    if (permissionState === "unsupported") return;
    if (!user) {
      setShowBanner(false);
      return;
    }

    const dismissed = localStorage.getItem("chatiq_push_banner_dismissed") === "true";
    if (permissionState === "default" && !dismissed) {
      setShowBanner(true);
    } else {
      setShowBanner(false);
    }
  }, [permissionState, user]);

  // Persist opt-in banner dismissal to local storage
  const dismissBanner = useCallback(() => {
    localStorage.setItem("chatiq_push_banner_dismissed", "true");
    setShowBanner(false);
  }, []);

  // Request browser permission and subscribe to Web Push
  const subscribeUser = useCallback(async () => {
    if (permissionState === "unsupported") return false;

    try {
      const permission = await Notification.requestPermission();
      setPermissionState(permission);

      if (permission !== "granted") {
        console.warn("Notification permission denied by user.");
        return false;
      }

      // Register the service worker
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      // Get existing subscription
      let subscription = await registration.pushManager.getSubscription();

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.error("NEXT_PUBLIC_VAPID_PUBLIC_KEY is not defined in environment variables");
        return false;
      }

      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      if (!subscription) {
        // Create new push subscription
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey,
        });
      }

      // Send subscription details to backend
      await API.post("/users/push-subscribe", subscription);
      console.log("Subscribed to push notifications successfully.");
      setShowBanner(false);
      return true;
    } catch (err) {
      console.error("Error setting up push subscription:", err);
      return false;
    }
  }, [permissionState]);

  // Unsubscribe the user locally and delete from the backend
  const unsubscribeUser = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const endpoint = subscription.endpoint;
        // Unsubscribe locally
        await subscription.unsubscribe();
        // Remove from database in backend
        await API.delete(`/users/push-unsubscribe`, { data: { endpoint } });
        console.log("Unsubscribed from push notifications successfully.");
      }
      setPermissionState(Notification.permission);
      setShowBanner(false);
    } catch (err) {
      console.error("Error unsubscribing from push notifications:", err);
    }
  }, []);

  return {
    permissionState,
    showBanner,
    subscribeUser,
    unsubscribeUser,
    dismissBanner,
  };
}

// Convert VAPID public key to standard Uint8Array required by subscribe()
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
