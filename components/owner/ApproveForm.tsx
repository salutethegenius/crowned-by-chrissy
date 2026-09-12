"use client";

import { useState } from "react";
import { useOffline } from "next/offline";
import { approveOwnerAction, declineOwnerAction } from "@/app/owner/actions";
import { formatClock } from "@/lib/time";
import { formatMoney } from "@/lib/money";

export function ApproveForm({
  appointment,
}: {
  appointment: {
    id: string;
    requestedStart: string;
    service: { name: string; durationMinutes: number | null; bufferMinutes: number; priceMinMinor: number | null };
    agreedPriceMinor: number | null;
  };
}) {
  const offline = useOffline();
  const start = new Date(appointment.requestedStart);
  const [error, setError] = useState<string | null>(null);
  const defaultPrice = appointment.agreedPriceMinor ?? appointment.service.priceMinMinor ?? 0;
  return (
    <form
      className="mt-8 space-y-3 rounded-2xl bg-white p-4"
      action={async (fd) => {
        if (offline) {
          setError("You’re offline. Approval is paused.");
          return;
        }
        const result = await approveOwnerAction(fd);
        if (result?.error) setError(result.error);
      }}
    >
      <input type="hidden" name="id" value={appointment.id} />
      <h2 className="font-medium">Approve</h2>
      <label className="block text-sm">
        Date
        <input name="date" type="date" required defaultValue={start.toISOString().slice(0, 10)} className="mt-1 w-full rounded-xl border px-3 py-3" />
      </label>
      <label className="block text-sm">
        Time
        <input name="time" type="time" required defaultValue={start.toISOString().slice(11, 16)} className="mt-1 w-full rounded-xl border px-3 py-3" />
      </label>
      <label className="block text-sm">
        Duration (minutes)
        <input name="duration" type="number" required defaultValue={appointment.service.durationMinutes ?? 90} className="mt-1 w-full rounded-xl border px-3 py-3" />
      </label>
      <label className="block text-sm">
        Buffer (minutes)
        <input name="buffer" type="number" required defaultValue={appointment.service.bufferMinutes} className="mt-1 w-full rounded-xl border px-3 py-3" />
      </label>
      <label className="block text-sm">
        Final price (B$)
        <input name="price" type="number" step="0.01" required defaultValue={(defaultPrice / 100).toFixed(2)} className="mt-1 w-full rounded-xl border px-3 py-3" />
      </label>
      <label className="block text-sm">
        Deposit (B$) — leave blank to use default
        <input name="deposit" type="number" step="0.01" className="mt-1 w-full rounded-xl border px-3 py-3" />
      </label>
      <label className="block text-sm">
        Note to client
        <textarea name="note" className="mt-1 w-full rounded-xl border px-3 py-3" rows={2} />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="withoutDeposit" /> Approve without an online deposit
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="needsAcceptance" /> Require client to accept this change
      </label>
      {error ? <p className="text-plum">{error}</p> : null}
      <button disabled={offline} className="min-h-12 w-full rounded-full bg-plum text-cream disabled:opacity-50" type="submit">
        Confirm approval
      </button>
      <button
        formAction={async (fd) => {
          if (offline) return;
          await declineOwnerAction(String(fd.get("id")), String(fd.get("note") || ""));
        }}
        disabled={offline}
        className="min-h-12 w-full rounded-full border border-ink/20"
        type="submit"
      >
        Decline
      </button>
      <p className="text-xs text-muted">
        Review price {formatMoney(defaultPrice)}, duration, deposit, and hold in one place before sending.
      </p>
    </form>
  );
}

void formatClock;
