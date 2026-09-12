import { LoginForm } from "./LoginForm";

export const metadata = { title: "Owner login" };

export default async function OwnerLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <h1 className="font-serif text-4xl text-ink">Owner login</h1>
      <p className="mt-2 text-muted">For Chrissy only.</p>
      <LoginForm next={next} />
    </main>
  );
}
