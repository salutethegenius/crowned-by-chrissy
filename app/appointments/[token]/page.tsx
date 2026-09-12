import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { formatBusiness, formatMoney } from "@/lib/display";
import { AppointmentActions } from "@/components/AppointmentActions";
import { expireHolds } from "@/lib/availability";
import { livePaymentsAllowed } from "@/lib/payments/cng";
import { isDemoMode } from "@/lib/env";
import { priceLabel } from "@/lib/pricing";

export const metadata = { title: "Your appointment" };

export default async function AppointmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ new?: string }>;
}) {
  await expireHolds();
  const { token } = await params;
  const q = await searchParams;
  const appointment = await prisma.appointment.findUnique({
    where: { publicToken: token },
    include: {
      service: true,
      client: true,
      quotes: true,
      inspiration: true,
      verifiedPayments: true,
    },
  });
  if (!appointment) notFound();
  const paid = appointment.verifiedPayments.find((p) => !p.exceptionReason);
  const proposed = appointment.quotes.find((x) => x.status === "PROPOSED");
  const canPay =
    appointment.status === "AWAITING_DEPOSIT" &&
    (isDemoMode() || livePaymentsAllowed());

  return (
    <div className="flex min-h-full flex-col bg-cream">
      <SiteHeader />
      <main className="mx-auto w-full max-w-xl px-4 py-16">
        {q.new ? (
          <div className="mb-8 rounded-3xl bg-lilac/40 p-5">
            <p className="font-serif text-2xl text-ink">Your request is with Chrissy.</p>
            <p className="mt-2 text-muted">
              Once she approves your appointment, you’ll receive a deposit payment link to secure your spot.
            </p>
          </div>
        ) : null}
        <p className="text-sm uppercase tracking-widest text-plum">{appointment.status.replaceAll("_", " ")}</p>
        <h1 className="mt-2 font-serif text-4xl text-ink">{appointment.service.name}</h1>
        <p className="mt-2 text-muted">{priceLabel(appointment.service)}</p>
        <dl className="mt-8 space-y-3">
          <div>
            <dt className="text-sm text-muted">Requested</dt>
            <dd>{formatBusiness(appointment.requestedStart)}</dd>
          </div>
          {appointment.approvedStart ? (
            <div>
              <dt className="text-sm text-muted">Approved time</dt>
              <dd>{formatBusiness(appointment.approvedStart)}</dd>
            </div>
          ) : null}
          {appointment.agreedPriceMinor != null ? (
            <div>
              <dt className="text-sm text-muted">Service total</dt>
              <dd>{formatMoney(appointment.agreedPriceMinor)}</dd>
            </div>
          ) : null}
          {appointment.depositMinor != null && appointment.status !== "REQUESTED" ? (
            <div>
              <dt className="text-sm text-muted">Deposit due</dt>
              <dd>{formatMoney(appointment.depositMinor)}</dd>
            </div>
          ) : null}
          {appointment.balanceMinor != null && appointment.status === "CONFIRMED" ? (
            <div>
              <dt className="text-sm text-muted">Remaining balance</dt>
              <dd>{formatMoney(appointment.balanceMinor)}</dd>
            </div>
          ) : null}
          {appointment.paymentDeadlineAt && appointment.status === "AWAITING_DEPOSIT" ? (
            <div>
              <dt className="text-sm text-muted">Pay by</dt>
              <dd>{formatBusiness(appointment.paymentDeadlineAt)}</dd>
            </div>
          ) : null}
          {appointment.customerNote ? (
            <div>
              <dt className="text-sm text-muted">Note from Chrissy</dt>
              <dd>{appointment.customerNote}</dd>
            </div>
          ) : null}
          {paid ? (
            <div>
              <dt className="text-sm text-muted">Payment</dt>
              <dd>Deposit paid{appointment.paymentStatus === "OFFLINE_RECORDED" ? " (recorded by Chrissy, not CNG-verified)" : ""}.</dd>
            </div>
          ) : null}
          {appointment.paymentStatus === "EXCEPTION" ? (
            <p className="rounded-2xl bg-tan p-4">A payment was received that needs Chrissy’s review. Your time is not automatically confirmed.</p>
          ) : null}
          {appointment.status === "AWAITING_DEPOSIT" && !canPay ? (
            <p className="rounded-2xl bg-tan p-4">
              Your appointment is approved. Online deposit collection is waiting on payment setup — Chrissy will follow up.
            </p>
          ) : null}
        </dl>
        {proposed ? (
          <div className="mt-8 rounded-3xl border border-plum/30 p-5">
            <p className="font-medium">Chrissy suggested an update. Please review before paying.</p>
            <p className="mt-2">{formatBusiness(proposed.startAt)} · {formatMoney(proposed.priceMinor)}</p>
          </div>
        ) : null}
        <AppointmentActions
          token={token}
          status={appointment.status}
          canPay={canPay}
          hasProposal={Boolean(proposed)}
        />
        <p className="mt-8 text-sm text-muted">Keep this page. It’s the private link to your request.</p>
      </main>
      <SiteFooter />
    </div>
  );
}
