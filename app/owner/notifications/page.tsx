import { prisma } from "@/lib/db";
import { retryNoticeAction } from "../actions";
import { EnablePushButton } from "@/components/owner/EnablePushButton";
import { renderTemplate } from "@/lib/notifications";
import { notificationProviders } from "@/lib/env";
import { getOwnerSession } from "@/lib/auth";
import { TestEmailForm } from "@/components/owner/TestEmailForm";

export default async function NotificationsPage() {
  const session = await getOwnerSession();
  const notices = notificationProviders();
  const rows = await prisma.notificationMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const preview = renderTemplate("approval_deposit", {
    clientName: "Alex",
    serviceName: "Knotless Braids",
    startAt: new Date().toISOString(),
    depositMinor: 2000,
    bookingUrl: "https://example.com",
  });
  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      <h1 className="font-serif text-3xl">Notifications</h1>
      <EnablePushButton />
      <section className="mt-6 rounded-2xl bg-white p-4">
        <h2 className="font-medium">Email (Resend)</h2>
        <p className="mt-2 text-sm text-muted">
          {notices.resend
            ? "Resend is configured. Appointment emails go out from the address in RESEND_FROM_EMAIL."
            : "Resend is not configured yet. Emails stay in the outbox as failed until keys are set."}
        </p>
        <TestEmailForm defaultEmail={session?.email ?? ""} emailReady={notices.resend} />
      </section>
      <section className="mt-6 rounded-2xl bg-white p-4">
        <h2 className="font-medium">Template preview</h2>
        <p className="mt-2 text-sm font-medium">{preview.subject}</p>
        <p className="mt-1 whitespace-pre-wrap text-sm text-muted">{preview.body}</p>
      </section>
      <ul className="mt-6 space-y-3">
        {rows.map((row) => (
          <li key={row.id} className="rounded-2xl bg-white p-4 text-sm">
            <p className="font-medium">{row.eventType} · {row.status}</p>
            <p className="text-muted">{row.channel} → {row.recipient}</p>
            {row.error ? <p className="text-plum">{row.error}</p> : null}
            {row.status === "FAILED" ? (
              <form action={async () => {
                "use server";
                await retryNoticeAction(row.id);
              }}>
                <button className="mt-2 min-h-11 rounded-full border px-4">Retry</button>
              </form>
            ) : null}
          </li>
        ))}
      </ul>
    </main>
  );
}
