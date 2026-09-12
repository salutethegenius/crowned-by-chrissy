"use client";

import { useState } from "react";
import { useOffline } from "next/offline";
import { Button } from "./Button";
import { acceptQuoteAction, cancelAction, payAction, rescheduleAction } from "@/app/appointments/actions";

export function AppointmentActions({
  token,
  status,
  canPay,
  hasProposal,
}: {
  token: string;
  status: string;
  canPay: boolean;
  hasProposal: boolean;
}) {
  const offline = useOffline();
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  async function run(fn: () => Promise<{ error?: string } | void>) {
    if (offline) {
      setError("You’re offline. Try again when you’re connected.");
      return;
    }
    const result = await fn();
    if (result && "error" in result && result.error) setError(result.error);
  }

  return (
    <div className="mt-8 space-y-3">
      {hasProposal ? (
        <Button className="w-full" variant="lilac" disabled={offline} onClick={() => run(() => acceptQuoteAction(token))}>
          Accept Chrissy’s update
        </Button>
      ) : null}
      {canPay ? (
        <Button className="w-full" variant="primary" disabled={offline} onClick={() => run(() => payAction(token))}>
          Pay deposit
        </Button>
      ) : null}
      {["REQUESTED", "AWAITING_DEPOSIT", "AWAITING_CLIENT_RESPONSE", "CONFIRMED"].includes(status) ? (
        <>
          <div className="rounded-2xl bg-white p-4">
            <p className="font-medium">Request a new time</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <input type="date" className="min-h-12 rounded-xl border px-3" value={date} onChange={(e) => setDate(e.target.value)} aria-label="New date" />
              <input type="time" className="min-h-12 rounded-xl border px-3" value={time} onChange={(e) => setTime(e.target.value)} aria-label="New time" />
            </div>
            <Button className="mt-3 w-full" variant="ghost" disabled={offline || !date || !time} onClick={() => run(() => rescheduleAction(token, date, time))}>
              Send reschedule request
            </Button>
          </div>
          <Button className="w-full" variant="ghost" disabled={offline} onClick={() => run(() => cancelAction(token))}>
            Cancel this request
          </Button>
        </>
      ) : null}
      {error ? <p className="text-plum">{error}</p> : null}
    </div>
  );
}
