import { notFound } from "next/navigation";
import { isDemoMode } from "@/lib/env";
import { prisma } from "@/lib/db";
import { simulateDemoPayment, verifyAndApplyPayment } from "@/lib/payments/cng";
import { formatMoney } from "@/lib/money";
import { DemoPayButton } from "@/components/DemoPayButton";

export const metadata = {
  title: "Demo checkout",
  robots: { index: false, follow: false },
};

export default async function DemoPayPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  if (!isDemoMode()) notFound();
  const { orderNumber } = await params;
  const attempt = await prisma.paymentAttempt.findUnique({
    where: { orderNumber },
    include: { appointment: { include: { service: true } } },
  });
  if (!attempt) notFound();
  return (
    <main className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="text-sm uppercase tracking-widest text-plum">Demo checkout</p>
      <h1 className="mt-3 font-serif text-4xl">Simulated Cash N’ Go payment</h1>
      <p className="mt-4 text-muted">
        {attempt.appointment.service.name} · {formatMoney(attempt.amountMinor)}
      </p>
      <p className="mt-2 text-sm text-muted">This never charges a real card or wallet.</p>
      <DemoPayButton orderNumber={orderNumber} />
    </main>
  );
}

export async function simulateAction(orderNumber: string) {
  "use server";
  await simulateDemoPayment(orderNumber);
  await verifyAndApplyPayment(orderNumber);
}
