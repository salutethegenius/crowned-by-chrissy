"use client";

import { useOffline } from "next/offline";

export function OfflineBanner() {
  const offline = useOffline();
  if (!offline) return null;
  return (
    <div className="bg-ink text-cream px-4 py-2 text-center text-sm" role="status">
      You’re offline. Browsing still works; booking, payments, and owner changes are paused until you’re back online.
    </div>
  );
}
