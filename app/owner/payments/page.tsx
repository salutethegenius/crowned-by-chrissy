import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { offlinePayAction } from "../actions";

export default async function PaymentsPage() {
  const payments = await prisma.verifiedPayment.findMany({
    include: { appointment: { include: { client: true, service: true } } },
    orderBy: { createdAt: "desc" },
    take: 80,
  });
  const gross = payments.filter((p) => !p.exceptionReason).reduce((s, p) => s + p.grossAmountMinor, 0);
  const exceptions = payments.filter((p) => p.exceptionReason);
  const awaiting = await prisma.appointment.findMany({
    where: { status: "AWAITING_DEPOSIT" },
    include: { client: true, service: true },
  });
  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      <h1 className="font-serif text-3xl">Payments</h1>
      <p className="mt-3 rounded-2xl bg-white p-4">Confirmed deposits collected: {formatMoney(gross)}</p>
      <p className="mt-2 text-sm text-muted">This is money received, not expected future revenue.</p>
      <h2 className="mt-8 font-medium">Exceptions</h2>
      <ul className="mt-3 space-y-2">
        {exceptions.map((p) => (
          <li key={p.id} className="rounded-xl bg-white p-3 text-sm">
            {p.appointment.client.name}: {p.exceptionReason} ({formatMoney(p.grossAmountMinor)})
          </li>
        ))}
      </ul>
      <h2 className="mt-8 font-medium">Record offline payment</h2>
      <p className="text-sm text-muted">Never labelled as Cash N’ Go verified.</p>
      <form action={offlinePayAction} className="mt-3 space-y-2 rounded-2xl bg-white p-4">
        <select name="id" className="w-full rounded-xl border px-3 py-3" required>
          {awaiting.map((a) => (
            <option key={a.id} value={a.id}>
              {a.client.name} · {a.service.name}
            </option>
          ))}
        </select>
        <input name="amount" type="number" step="0.01" required placeholder="Amount B$" className="w-full rounded-xl border px-3 py-3" />
        <input name="note" placeholder="How it was paid" className="w-full rounded-xl border px-3 py-3" />
        <button className="min-h-11 w-full rounded-full bg-plum text-cream">Record</button>
      </form>
    </main>
  );
}
