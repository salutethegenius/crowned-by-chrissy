import { loginAction } from "./actions";

export const metadata = {
  title: "Owner login",
  robots: { index: false, follow: false },
};

export default async function OwnerLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <h1 className="font-serif text-4xl text-ink">Owner login</h1>
      <p className="mt-2 text-muted">For Chrissy only.</p>
      <form action={loginAction} className="mt-8 space-y-4">
        <input type="hidden" name="next" value={next || "/owner"} />
        <label className="block">
          Email
          <input name="email" type="email" required className="mt-1 w-full rounded-xl border border-ink/15 px-3 py-3" autoComplete="username" />
        </label>
        <label className="block">
          Password
          <input name="password" type="password" required className="mt-1 w-full rounded-xl border border-ink/15 px-3 py-3" autoComplete="current-password" />
        </label>
        {error ? (
          <p className="text-plum">
            {error === "rate" ? "Too many attempts. Try again in a few minutes." : "That email or password didn’t match."}
          </p>
        ) : null}
        <button type="submit" className="min-h-12 w-full rounded-full bg-plum text-cream">
          Sign in
        </button>
      </form>
    </main>
  );
}
