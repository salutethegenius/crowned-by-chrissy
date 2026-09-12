import { prisma } from "@/lib/db";
import { clientCreditBalance } from "@/lib/credit";
import { displayPhone } from "@/lib/phone";
import Link from "next/link";

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({ orderBy: { updatedAt: "desc" }, take: 100 });
  const credits = await Promise.all(clients.map((c) => clientCreditBalance(c.id)));
  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      <h1 className="font-serif text-3xl">Clients</h1>
      <ul className="mt-6 space-y-3">
        {clients.map((c, i) => (
          <li key={c.id} className="rounded-2xl bg-white p-4">
            <Link href={`/owner/clients/${c.id}`} className="font-medium">
              {c.name} {c.isDemo ? "(demo)" : ""}
            </Link>
            <p className="text-sm">{displayPhone(c.phone)}</p>
            {credits[i] > 0 ? <p className="text-sm text-plum">Credit on file</p> : null}
          </li>
        ))}
      </ul>
    </main>
  );
}
