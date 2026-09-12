import { prisma } from "@/lib/db";
import { expireHolds } from "@/lib/availability";
import { formatBusiness, formatBusinessTime } from "@/lib/time";
import { createWalkInAction, blockTimeAction } from "../actions";
import Link from "next/link";

async function walkIn(formData: FormData): Promise<void> {
  "use server";
  await createWalkInAction(formData);
}

async function block(formData: FormData): Promise<void> {
  "use server";
  await blockTimeAction(formData);
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; day?: string }>;
}) {
  await expireHolds();
  const { view = "agenda" } = await searchParams;
  const slots = await prisma.calendarSlot.findMany({
    include: { appointment: { include: { client: true, service: true } } },
    orderBy: { startAt: "asc" },
    take: 80,
  });
  const services = await prisma.service.findMany({ where: { active: true }, orderBy: { displayOrder: "asc" } });
  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      <h1 className="font-serif text-3xl">Calendar</h1>
      <div className="mt-4 flex gap-2">
        {["agenda", "day", "week"].map((v) => (
          <Link key={v} href={`/owner/calendar?view=${v}`} className={`rounded-full px-4 py-2 text-sm ${view === v ? "bg-plum text-cream" : "bg-white"}`}>
            {v}
          </Link>
        ))}
      </div>
      <ol className="mt-6 space-y-3">
        {slots.map((slot) => (
          <li key={slot.id} className="rounded-2xl bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-plum">{slot.kind}</p>
            <p className="font-medium">
              {slot.appointment ? `${slot.appointment.client.name} · ${slot.appointment.service.name}` : slot.title}
            </p>
            <p className="text-sm">{formatBusiness(slot.startAt)} – {formatBusinessTime(slot.endAt)}</p>
            {slot.appointment ? (
              <Link className="text-sm text-plum" href={`/owner/requests/${slot.appointment.id}`}>
                Open
              </Link>
            ) : null}
          </li>
        ))}
      </ol>
      <form action={walkIn} className="mt-10 space-y-3 rounded-2xl bg-white p-4">
        <h2 className="font-medium">Add phone / WhatsApp booking</h2>
        <input name="name" required placeholder="Client name" className="w-full rounded-xl border px-3 py-3" />
        <input name="phone" required placeholder="Mobile" className="w-full rounded-xl border px-3 py-3" />
        <select name="serviceId" className="w-full rounded-xl border px-3 py-3" required>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <input name="date" type="date" required className="w-full rounded-xl border px-3 py-3" />
        <input name="time" type="time" required className="w-full rounded-xl border px-3 py-3" />
        <input name="duration" type="number" defaultValue={90} className="w-full rounded-xl border px-3 py-3" />
        <input name="price" type="number" step="0.01" required placeholder="Price B$" className="w-full rounded-xl border px-3 py-3" />
        <button className="min-h-12 w-full rounded-full bg-plum text-cream">Save booking</button>
      </form>
      <form action={block} className="mt-6 space-y-3 rounded-2xl bg-white p-4">
        <h2 className="font-medium">Block time</h2>
        <input name="title" placeholder="Break / closure" className="w-full rounded-xl border px-3 py-3" />
        <input name="date" type="date" required className="w-full rounded-xl border px-3 py-3" />
        <input name="start" type="time" required className="w-full rounded-xl border px-3 py-3" />
        <input name="end" type="time" required className="w-full rounded-xl border px-3 py-3" />
        <button className="min-h-12 w-full rounded-full border">Block</button>
      </form>
    </main>
  );
}
