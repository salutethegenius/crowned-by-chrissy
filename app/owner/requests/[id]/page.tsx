import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatBusiness } from "@/lib/time";
import { formatMoney } from "@/lib/money";
import { displayPhone } from "@/lib/phone";
import { ApproveForm } from "@/components/owner/ApproveForm";
import { whatsappHref, renderTemplate } from "@/lib/notifications";
import { readPrivateFile } from "@/lib/storage";

export default async function RequestDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await prisma.appointment.findUnique({
    where: { id },
    include: { client: true, service: { include: { optionGroups: { include: { options: true } } } }, inspiration: true },
  });
  if (!row) notFound();
  const msg = renderTemplate("request_received_owner", {
    clientName: row.client.name,
    serviceName: row.service.name,
    startAt: row.requestedStart.toISOString(),
  });
  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      <h1 className="font-serif text-3xl">{row.client.name}</h1>
      <p className="text-muted">{row.service.name}</p>
      <p className="mt-2">{formatBusiness(row.requestedStart)}</p>
      <p className="mt-1">
        <a href={`tel:${row.client.phone}`}>{displayPhone(row.client.phone)}</a>
      </p>
      {row.client.email ? <p>{row.client.email}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <a className="rounded-full bg-white px-4 py-2 text-sm" href={whatsappHref(row.client.phone, msg.body)}>
          Open WhatsApp with message
        </a>
        <CopyButton text={msg.body} />
      </div>
      {row.notes ? <p className="mt-4 rounded-2xl bg-white p-4">{row.notes}</p> : null}
      {row.inspiration ? <p className="mt-3 text-sm">Private inspiration photo on file.</p> : null}
      <ApproveForm appointment={JSON.parse(JSON.stringify(row))} />
    </main>
  );
}

function CopyButton({ text }: { text: string }) {
  return (
    <form
      action={async () => {
        "use server";
      }}
    >
      <p className="rounded-full bg-white px-4 py-2 text-sm" id="copy-msg">
        Copy: {text.slice(0, 48)}…
      </p>
    </form>
  );
}

void readPrivateFile;
