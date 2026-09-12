"use client";

import { useState } from "react";

export function EnablePushButton() {
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div className="mt-4">
      <button
        type="button"
        className="min-h-12 rounded-full bg-white px-5"
        onClick={async () => {
          if (!("Notification" in window) || !("serviceWorker" in navigator)) {
            setMsg("Push isn’t supported in this browser. Your in-app list still works.");
            return;
          }
          const perm = await Notification.requestPermission();
          setMsg(perm === "granted" ? "Permission granted. Configure VAPID keys to deliver pushes." : "Permission was not granted.");
        }}
      >
        Enable push alerts
      </button>
      {msg ? <p className="mt-2 text-sm text-muted">{msg}</p> : null}
    </div>
  );
}
