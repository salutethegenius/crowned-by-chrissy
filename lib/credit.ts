import "server-only";

import { prisma } from "./db";

export async function clientCreditBalance(clientId: string) {
  const rows = await prisma.creditLedger.findMany({ where: { clientId } });
  return rows.reduce((sum, row) => {
    if (row.type === "ORIGINAL_PAYMENT" || row.type === "ADJUSTMENT") return sum;
    if (row.type === "CREDIT_ISSUED") return sum + row.amountMinor;
    if (row.type === "CREDIT_ALLOCATED") return sum - row.amountMinor;
    return sum;
  }, 0);
}

export async function issueRetainedCredit(params: {
  clientId: string;
  appointmentId: string;
  amountMinor: number;
  sourcePaymentId?: string;
  actor: string;
}) {
  if (params.amountMinor <= 0) return;
  await prisma.creditLedger.create({
    data: {
      clientId: params.clientId,
      appointmentId: params.appointmentId,
      type: "CREDIT_ISSUED",
      amountMinor: params.amountMinor,
      sourcePaymentId: params.sourcePaymentId,
      note: "Deposit retained as credit toward a future approved appointment.",
      createdBy: params.actor,
    },
  });
}

export async function allocateCredit(params: {
  clientId: string;
  targetAppointmentId: string;
  amountMinor: number;
  actor: string;
}) {
  const available = await clientCreditBalance(params.clientId);
  const amount = Math.min(available, params.amountMinor);
  if (amount <= 0) return 0;
  const allocationKey = `alloc:${params.clientId}:${params.targetAppointmentId}`;
  const target = await prisma.appointment.findUnique({
    where: { id: params.targetAppointmentId },
    select: { id: true },
  });
  try {
    await prisma.creditLedger.create({
      data: {
        clientId: params.clientId,
        appointmentId: target?.id ?? null,
        type: "CREDIT_ALLOCATED",
        amountMinor: amount,
        allocationKey,
        note: "Applied retained deposit credit",
        createdBy: params.actor,
      },
    });
    return amount;
  } catch {
    return 0;
  }
}
