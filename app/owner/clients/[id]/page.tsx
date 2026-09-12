import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { clientCreditBalance } from "@/lib/credit";
import { formatMoney } from "@/lib/money";
import { formatBusiness } from "@/lib/time";
import { displayPhone } from "@/lib/phone";
import { requireOwner } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export default async function ClientDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await prisma.client.findUnique({
    where: { id },
    include: { appointments: { include: { service: true }, orderBy: { createdAt: "desc" } }, credits: true },
  });
  if (!client) notFound();
  const credit = await clientCreditBalance(client.id);
  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      <h1 className="font-serif text-3xl">{client.name}</h1>
      <p>{displayPhone(client.phone)}</p>
      <p className="mt-2">Retained deposit credit: {formatMoney(credit)}</p>
      <form action={saveNotes} className="mt-4">
        <input type="hidden" name="id" value={client.id} />
        <label className="block text-sm">
          Private notes
          <textarea name="notes" defaultValue={client.privateNotes} className="mt-1 w-full rounded-xl border px-3 py-3" rows={4} />
        </label>
        <button className="mt-2 min-h-11 rounded-full bg-plum px-5 text-cream">Save notes</button>
      </form>
      <h2 className="mt-8 font-medium">History</h2>
      <ul className="mt-3 space-y-2">
        {client.appointments.map((a) => (
          <li key={a.id} className="rounded-xl bg-white p-3 text-sm">
            {a.service.name} · {a.status} · {formatBusiness(a.requestedStart)}
          </li>
        ))}
      </ul>
    </main>
  );
}

async function saveNotes(formData: FormData) {
  "use server";
  await requireOwner();
  await prisma.client.update({
    where: { id: String(formData.get("id")) },
    data: { privateNotes: String(formData.get("notes") || "") },
  });
  revalidatePath("/owner/clients");
}
