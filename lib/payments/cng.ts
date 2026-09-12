import "server-only";

import { nanoid } from "nanoid";
import { prisma } from "../db";
import { appUrl, CNG_MIN_AMOUNT_MINOR, cngConfig, isDemoMode } from "../env";
import { minorToCngAmount, parseCngAmountToMinor } from "../money";
import { audit } from "../audit";
import { expireHolds } from "../availability";
import { Prisma } from "@prisma/client";

export type CngTransaction = {
  success: boolean;
  id: string;
  amount: number;
  total?: number;
  fee?: number;
  processed: number | boolean;
  merchantId: string;
  webOrderNumber: string;
  specialId?: string;
  raw: unknown;
};

function authBase() {
  return cngConfig();
}

export function paymentProviderName() {
  if (isDemoMode()) return "demo";
  return "cng";
}

export function livePaymentsAllowed() {
  if (isDemoMode()) return true;
  const cng = cngConfig();
  return cng.configured && (cng.env === "sandbox" || cng.canChargeLive);
}

export async function createHostedPaymentUrl(params: {
  orderNumber: string;
  amountMinor: number;
  passphrase: string;
}) {
  if (params.amountMinor < CNG_MIN_AMOUNT_MINOR) {
    throw new Error(`Amount must be greater than B$1.00 (CNG minimum).`);
  }
  const amount = minorToCngAmount(params.amountMinor);
  const success = `${appUrl()}/pay/return?order=${encodeURIComponent(params.orderNumber)}`;
  const cancel = `${appUrl()}/pay/cancel?order=${encodeURIComponent(params.orderNumber)}`;

  if (isDemoMode()) {
    const redirectUrl = `${appUrl()}/demo/pay/${encodeURIComponent(params.orderNumber)}`;
    return { redirectUrl, amount };
  }

  const cng = authBase();
  if (!cng.configured) {
    throw new Error("Cash N' Go is not configured. Deposits cannot be collected online yet.");
  }
  if (cng.env === "production" && !cng.canChargeLive) {
    throw new Error("Live Cash N' Go charges are disabled until credentials are tested.");
  }
  if (cng.paymentOptions && cng.paymentMethod) {
    throw new Error("PAYMENT_OPTIONS and PAYMENT_METHOD cannot both be set.");
  }

  const url = new URL(cng.authUrl);
  url.searchParams.set("AUTH_ID", cng.authId);
  url.searchParams.set("AMOUNT", amount);
  url.searchParams.set("URL_SUCCESS", success);
  url.searchParams.set("URL_CANCEL", cancel);
  url.searchParams.set("ORDER_NUMBER", params.orderNumber);
  url.searchParams.set("PASSPHRASE", params.passphrase);
  if (cng.paymentOptions) url.searchParams.set("PAYMENT_OPTIONS", cng.paymentOptions);
  else if (cng.paymentMethod) url.searchParams.set("PAYMENT_METHOD", cng.paymentMethod);
  return { redirectUrl: url.toString(), amount };
}

export async function fetchTransaction(orderNumber: string): Promise<CngTransaction | null> {
  if (isDemoMode()) {
    const row = await prisma.demoGatewayPayment.findUnique({ where: { orderNumber } });
    if (!row || !row.processed) return null;
    const cng = authBase();
    return {
      success: true,
      id: row.id,
      amount: row.amountMinor / 100,
      total: row.amountMinor / 100,
      fee: 0,
      processed: 1,
      merchantId: cng.authId || "demo-merchant",
      webOrderNumber: orderNumber,
      specialId: row.specialId ?? `DEMO-${orderNumber}`,
      raw: row,
    };
  }

  const cng = authBase();
  if (!cng.configured) return null;
  const url = new URL(cng.infoUrl);
  url.searchParams.set("AUTH_ID", cng.authId);
  url.searchParams.set("ORDER_NUMBER", orderNumber);
  const res = await fetch(url.toString(), {
    headers: { API_KEY: cng.apiKey },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    success?: boolean;
    transaction?: Record<string, unknown>;
  };
  if (!json.success || !json.transaction) return null;
  const t = json.transaction;
  return {
    success: true,
    id: String(t.id ?? ""),
    amount: Number(t.amount),
    total: t.total != null ? Number(t.total) : undefined,
    fee: t.fee != null ? Number(t.fee) : undefined,
    processed: t.processed as number | boolean,
    merchantId: String(t.merchantId ?? ""),
    webOrderNumber: String(t.webOrderNumber ?? ""),
    specialId: t.specialId ? String(t.specialId) : undefined,
    raw: json,
  };
}

export async function simulateDemoPayment(orderNumber: string) {
  if (!isDemoMode()) throw new Error("Demo payments are only available in demo mode.");
  const attempt = await prisma.paymentAttempt.findUnique({ where: { orderNumber } });
  if (!attempt) throw new Error("Unknown payment.");
  await prisma.demoGatewayPayment.upsert({
    where: { orderNumber },
    create: {
      orderNumber,
      amountMinor: attempt.amountMinor,
      processed: true,
      specialId: `DEMO-${nanoid(6)}`,
    },
    update: { processed: true, amountMinor: attempt.amountMinor },
  });
}

function processedOk(value: number | boolean) {
  return value === 1 || value === true;
}

export async function verifyAndApplyPayment(orderNumber: string) {
  const attempt = await prisma.paymentAttempt.findUnique({
    where: { orderNumber },
    include: { appointment: true, quote: true, verifiedPayment: true },
  });
  if (!attempt) return { ok: false as const, reason: "Unknown order." };
  if (attempt.verifiedPayment) {
    return { ok: true as const, already: true, appointmentId: attempt.appointmentId };
  }

  const txinfo = await fetchTransaction(orderNumber);
  if (!txinfo || !txinfo.success || !processedOk(txinfo.processed)) {
    await prisma.paymentAttempt.update({
      where: { id: attempt.id },
      data: { status: "PENDING" },
    });
    return { ok: false as const, reason: "Payment is not verified yet." };
  }

  const cng = authBase();
  const expectedMerchant = isDemoMode() ? txinfo.merchantId : cng.authId;
  const grossMinor = parseCngAmountToMinor(txinfo.amount);
  const issues: string[] = [];
  if (expectedMerchant && txinfo.merchantId && txinfo.merchantId !== expectedMerchant) {
    issues.push("Merchant ID did not match.");
  }
  if (txinfo.webOrderNumber && txinfo.webOrderNumber !== orderNumber) {
    issues.push("Order reference did not match.");
  }
  if (grossMinor == null || grossMinor !== attempt.amountMinor) {
    issues.push("Gross amount did not match the expected deposit.");
  }

  return prisma.$transaction(async (db) => {
    await expireHolds(db);
    const existingTx = await db.verifiedPayment.findUnique({
      where: { cngTransactionId: txinfo.id },
    });
    if (existingTx) {
      return { ok: true as const, already: true, appointmentId: existingTx.appointmentId };
    }

    const appt = await db.appointment.findUnique({ where: { id: attempt.appointmentId } });
    if (!appt) return { ok: false as const, reason: "Appointment missing." };

    const slot = await db.calendarSlot.findUnique({ where: { appointmentId: appt.id } });
    const holdValid =
      appt.status === "AWAITING_DEPOSIT" &&
      appt.holdExpiresAt &&
      appt.holdExpiresAt > new Date() &&
      Boolean(slot);

    const exception =
      issues.length ||
      !holdValid ||
      ["EXPIRED", "CANCELLED", "DECLINED"].includes(appt.status);

    const payment = await db.verifiedPayment.create({
      data: {
        cngTransactionId: txinfo.id,
        cngPaymentId: txinfo.specialId,
        paymentAttemptId: attempt.id,
        appointmentId: appt.id,
        grossAmountMinor: grossMinor ?? attempt.amountMinor,
        netAmountMinor: txinfo.total != null ? parseCngAmountToMinor(txinfo.total) : null,
        feeMinor: txinfo.fee != null ? parseCngAmountToMinor(txinfo.fee) : null,
        provider: paymentProviderName(),
        source: isDemoMode() ? "demo" : "cng",
        exceptionReason: exception
          ? issues.join(" ") ||
            `Payment arrived while appointment was ${appt.status.toLowerCase()} or the hold was no longer valid.`
          : null,
        rawPayload: txinfo.raw as Prisma.InputJsonValue,
      },
    });

    await db.paymentAttempt.update({
      where: { id: attempt.id },
      data: { status: exception ? "EXCEPTION" : "VERIFIED" },
    });

    await db.creditLedger.create({
      data: {
        clientId: appt.clientId,
        appointmentId: appt.id,
        type: "ORIGINAL_PAYMENT",
        amountMinor: payment.grossAmountMinor,
        sourcePaymentId: payment.id,
        note: exception ? "Recorded with exception" : "Deposit received",
        createdBy: "system",
      },
    });

    if (exception) {
      await db.appointment.update({
        where: { id: appt.id },
        data: { paymentStatus: "EXCEPTION" },
      });
      await db.auditEvent.create({
        data: {
          actor: "system",
          action: "payment_exception",
          appointmentId: appt.id,
          metadata: { orderNumber, reason: payment.exceptionReason },
        },
      });
      return {
        ok: false as const,
        reason: payment.exceptionReason ?? "Payment needs manual review.",
        exception: true,
      };
    }

    await db.calendarSlot.update({
      where: { appointmentId: appt.id },
      data: { kind: "CONFIRMED" },
    });
    await db.appointment.update({
      where: { id: appt.id },
      data: {
        status: "CONFIRMED",
        paymentStatus: "PAID",
        balanceMinor: Math.max(0, (appt.agreedPriceMinor ?? 0) - payment.grossAmountMinor),
      },
    });
    await db.auditEvent.create({
      data: {
        actor: "system",
        action: "payment_confirmed",
        appointmentId: appt.id,
        metadata: { orderNumber, grossMinor: payment.grossAmountMinor },
      },
    });
    return { ok: true as const, already: false, appointmentId: appt.id };
  });
}

export async function reconcilePendingPayments() {
  const pending = await prisma.paymentAttempt.findMany({
    where: { status: { in: ["CREATED", "REDIRECTED", "PENDING", "CANCELLED_REDIRECT"] } },
    take: 40,
    orderBy: { createdAt: "asc" },
  });
  const results = [];
  for (const attempt of pending) {
    results.push(await verifyAndApplyPayment(attempt.orderNumber));
  }
  return results;
}

void audit;
