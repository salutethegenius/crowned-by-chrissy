"use client";

import { useActionState } from "react";
import { sendTestEmailAction } from "@/app/owner/actions";

export function TestEmailForm({ defaultEmail, emailReady }: { defaultEmail: string; emailReady: boolean }) {
  const [state, action, pending] = useActionState(sendTestEmailAction, null);

  if (!emailReady) {
    return (
      <p className="mt-3 text-sm text-muted">
        Email stays off until <code>RESEND_API_KEY</code> and <code>RESEND_FROM_EMAIL</code> are set. Use a verified Resend
        domain, then send a test from here.
      </p>
    );
  }

  return (
    <form action={action} className="mt-4 space-y-3">
      <label className="block text-sm">
        Send a test email to
        <input
          name="email"
          type="email"
          required
          defaultValue={defaultEmail}
          className="mt-1 w-full rounded-xl border px-3 py-2"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-full bg-plum px-4 text-cream disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send test email"}
      </button>
      {state?.error ? <p className="text-sm text-plum">{state.error}</p> : null}
      {state?.ok ? <p className="text-sm text-ink">{state.ok}</p> : null}
    </form>
  );
}
