import { prisma } from "@/lib/db";
import { formatBusiness } from "@/lib/time";
import Link from "next/link";
import { Photo } from "@/components/Photo";

export default async function RequestsPage() {
  const rows = await prisma.appointment.findMany({
    where: { status: { in: ["REQUESTED", "AWAITING_CLIENT_RESPONSE", "AWAITING_DEPOSIT"] } },
    include: { client: true, service: true },
    orderBy: { createdAt: "desc" },
  });
  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      <h1 className="font-serif text-3xl">Requests</h1>
      <ul className="mt-6 space-y-3">
        {rows.map((row) => (
          <li key={row.id}>
            <Link href={`/owner/requests/${row.id}`} className="block rounded-2xl bg-white p-4">
              <p className="font-medium">{row.client.name}</p>
              <p className="text-sm text-muted">{row.service.name}</p>
              <p className="text-sm">{formatBusiness(row.requestedStart)}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-plum">{row.status.replaceAll("_", " ")}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
