"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => loginAction(formData),
    null,
  );
  return (
    <form action={action} className="mt-8 space-y-4">
      <input type="hidden" name="next" value={next || "/owner"} />
      <label className="block">
        Email
        <input name="email" type="email" required className="mt-1 w-full rounded-xl border border-ink/15 px-3 py-3" autoComplete="username" />
      </label>
      <label className="block">
        Password
        <input name="password" type="password" required className="mt-1 w-full rounded-xl border border-ink/15 px-3 py-3" autoComplete="current-password" />
      </label>
      {state?.error ? <p className="text-plum">{state.error}</p> : null}
      <button type="submit" className="min-h-12 w-full rounded-full bg-plum text-cream">
        Sign in
      </button>
    </form>
  );
}
