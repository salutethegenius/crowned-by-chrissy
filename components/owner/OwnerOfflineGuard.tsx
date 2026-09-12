"use client";

import { useOffline } from "next/offline";

export function OwnerOfflineGuard() {
  const offline = useOffline();
  if (!offline) return null;
  return (
    <div className="bg-ink px-4 py-2 text-center text-sm text-cream" role="status">
      Offline — approvals, calendar changes, and payments are disabled until you reconnect.
    </div>
  );
}
