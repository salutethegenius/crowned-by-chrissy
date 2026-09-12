import { prisma } from "@/lib/db";
import { expireHolds } from "@/lib/availability";
import { formatBusiness } from "@/lib/time";
import Link from "next/link";

export default async function OwnerToday() {
  await expireHolds();
  const now = new Date();
  const later = new Date(now.getTime() + 36 * 60 * 60 * 1000);
  const [upcoming, requests, deposits, exceptions] = await Promise.all([
    prisma.appointment.findMany({
      where: { status: "CONFIRMED", approvedStart: { gte: now, lt: later } },
      include: { client: true, service: true },
      orderBy: { approvedStart: "asc" },
    }),
    prisma.appointment.count({ where: { status: { in: ["REQUESTED", "AWAITING_CLIENT_RESPONSE"] } } }),
    prisma.appointment.findMany({
      where: { status: "AWAITING_DEPOSIT" },
      include: { client: true, service: true },
      orderBy: { holdExpiresAt: "asc" },
    }),
    prisma.appointment.count({ where: { paymentStatus: "EXCEPTION" } }),
  ]);

  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      <h1 className="font-serif text-3xl">Today</h1>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Stat href="/owner/requests" label="Requests to review" value={requests} />
        <Stat href="/owner/payments" label="Payment exceptions" value={exceptions} />
      </div>
      <section className="mt-8">
        <h2 className="font-medium">Upcoming</h2>
        <ul className="mt-3 space-y-3">
          {upcoming.length ? upcoming.map((a) => (
            <li key={a.id} className="rounded-2xl bg-white p-4">
              <p className="font-medium">{a.client.name}</p>
              <p className="text-sm text-muted">{a.service.name}</p>
              <p className="text-sm">{a.approvedStart ? formatBusiness(a.approvedStart) : ""}</p>
            </li>
          )) : <p className="text-muted">No confirmed appointments in the next day and a half.</p>}
        </ul>
      </section>
      <section className="mt-8">
        <h2 className="font-medium">Deposits waiting</h2>
        <ul className="mt-3 space-y-3">
          {deposits.map((a) => (
            <li key={a.id} className="rounded-2xl bg-white p-4">
              <Link href={`/owner/requests/${a.id}`} className="font-medium">
                {a.client.name} · {a.service.name}
              </Link>
              <p className="text-sm text-muted">
                Hold until {a.holdExpiresAt ? formatBusiness(a.holdExpiresAt) : "—"}
              </p>
            </li>
          ))}
        </ul>
      </section>
      <Link href="/owner/calendar" className="mt-8 inline-flex min-h-12 items-center rounded-full bg-plum px-5 text-cream">
        Quick add appointment
      </Link>
    </main>
  );
}

function Stat({ href, label, value }: { href: string; label: string; value: number }) {
  return (
    <Link href={href} className="rounded-2xl bg-white p-4">
      <p className="text-3xl font-serif">{value}</p>
      <p className="text-sm text-muted">{label}</p>
    </Link>
  );
}
