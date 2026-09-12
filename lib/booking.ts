import "server-only";

import { nanoid } from "nanoid";
import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { appUrl, CNG_MIN_AMOUNT_MINOR, isDemoMode } from "./env";
import { getSettings } from "./settings";
import { computeDepositMinor, isQuoteRequired } from "./pricing";
import { addMinutesUtc } from "./time";
import { expireHolds, reserveSlot, slotUnavailable } from "./availability";
import { SlotUnavailableError, AppError } from "./errors";
import { enqueueNotification, cancelScheduled, renderTemplate } from "./notifications";
import { createHostedPaymentUrl, livePaymentsAllowed } from "./payments/cng";
import { allocateCredit, issueRetainedCredit, clientCreditBalance } from "./credit";
import { audit } from "./audit";
import { normalizePhone, isLikelyEmail } from "./phone";

function token() {
  return nanoid(32);
}

function orderNumber() {
  return `CBC-${Date.now().toString(36).toUpperCase()}-${nanoid(8)}`;
}

function bookingUrl(publicToken: string) {
  return `${appUrl()}/appointments/${publicToken}`;
}

async function notifyClientAndOwner(params: {
  appointmentId: string;
  clientEmail?: string | null;
  clientPhone: string;
  ownerEmail?: string | null;
  preference: string;
  clientEvent: string;
  clientTemplate: string;
  payload: Record<string, unknown>;
  ownerEvent?: string;
  ownerTemplate?: string;
  ownerPayload?: Record<string, unknown>;
}) {
  const settings = await getSettings();
  const channels: Array<"EMAIL" | "SMS" | "IN_APP"> = [];
  if (params.preference === "email" && params.clientEmail) channels.push("EMAIL");
  if (params.preference === "sms") channels.push("SMS");
  channels.push("IN_APP");
  for (const channel of channels) {
    const recipient =
      channel === "EMAIL" ? params.clientEmail! : channel === "SMS" ? params.clientPhone : "client";
    await enqueueNotification(prisma, {
      eventType: params.clientEvent,
      channel,
      recipient,
      appointmentId: params.appointmentId,
      templateKey: params.clientTemplate,
      payload: params.payload,
      idempotencyKey: `${params.clientEvent}:${params.appointmentId}:${channel}:${params.payload.quoteVersion ?? "v"}`,
    });
  }
  if (params.ownerEvent && params.ownerTemplate) {
    await enqueueNotification(prisma, {
      eventType: params.ownerEvent,
      channel: "IN_APP",
      recipient: "owner",
      appointmentId: params.appointmentId,
      templateKey: params.ownerTemplate,
      payload: params.ownerPayload ?? params.payload,
      idempotencyKey: `${params.ownerEvent}:${params.appointmentId}:owner`,
    });
    if (params.ownerEmail) {
      await enqueueNotification(prisma, {
        eventType: params.ownerEvent,
        channel: "EMAIL",
        recipient: params.ownerEmail,
        appointmentId: params.appointmentId,
        templateKey: params.ownerTemplate,
        payload: params.ownerPayload ?? params.payload,
        idempotencyKey: `${params.ownerEvent}:${params.appointmentId}:owner-email`,
      });
    }
  }
  void settings;
}

export async function submitAppointmentRequest(input: {
  name: string;
  phone: string;
  email?: string;
  serviceId: string;
  selectedOptions: Record<string, string>;
  requestedStart: Date;
  alternativeStart?: Date | null;
  notes?: string;
  inspirationMediaId?: string;
  lookMediaId?: string;
  policyAcknowledged: boolean;
  notificationPreference: "email" | "sms" | "link";
  path: "DISCOVERY" | "DIRECT";
  ipKey?: string;
}) {
  if (!input.policyAcknowledged) {
    throw new AppError("Please acknowledge the booking and deposit policy.", "POLICY");
  }
  const phone = normalizePhone(input.phone);
  if (!phone) throw new AppError("Enter a valid mobile number.", "PHONE");
  if (input.notificationPreference === "email") {
    if (!input.email || !isLikelyEmail(input.email)) {
      throw new AppError("Email is required for email updates.", "EMAIL");
    }
  }
  const settings = await getSettings();
  const days = (settings.workingDays as number[]) ?? [];
  if (!settings.requestsOpen || !days.length) {
    throw new AppError(
      "Online requests are not available yet. You can still message Chrissy on WhatsApp.",
      "CLOSED",
    );
  }
  const service = await prisma.service.findUnique({
    where: { id: input.serviceId },
    include: { optionGroups: { include: { options: true } } },
  });
  if (!service || !service.active) throw new AppError("That service is unavailable.", "SERVICE");
  if (!service.durationMinutes) {
    throw new AppError("This service is not bookable online until timing is configured.", "DURATION");
  }

  const existingClient = await prisma.client.findFirst({ where: { phone } });
  const client = existingClient
    ? await prisma.client.update({
        where: { id: existingClient.id },
        data: { name: input.name.trim(), email: input.email?.trim() || existingClient.email },
      })
    : await prisma.client.create({
        data: {
          name: input.name.trim(),
          phone,
          email: input.email?.trim() || null,
          isDemo: isDemoMode(),
        },
      });

  const publicToken = token();
  const appointment = await prisma.appointment.create({
    data: {
      publicToken,
      clientId: client.id,
      path: input.path,
      serviceId: service.id,
      selectedOptions: input.selectedOptions,
      requestedStart: input.requestedStart,
      alternativeStart: input.alternativeStart ?? null,
      notes: input.notes?.trim() || null,
      inspirationMediaId: input.inspirationMediaId,
      lookMediaId: input.lookMediaId,
      policyAcknowledged: true,
      notificationPreference: input.notificationPreference,
      status: "REQUESTED",
      isDemo: isDemoMode(),
    },
  });

  const payload = {
    clientName: client.name,
    serviceName: service.name,
    startAt: input.requestedStart.toISOString(),
    bookingUrl: bookingUrl(publicToken),
  };
  const owner = await prisma.owner.findFirst({ where: { isDemo: isDemoMode() } });
  await notifyClientAndOwner({
    appointmentId: appointment.id,
    clientEmail: client.email,
    clientPhone: client.phone,
    ownerEmail: owner?.email,
    preference: input.notificationPreference,
    clientEvent: "request_received",
    clientTemplate: "request_received_client",
    payload,
    ownerEvent: "new_request",
    ownerTemplate: "request_received_owner",
  });
  await audit({ actor: "client", action: "request_submitted", appointmentId: appointment.id });
  return { publicToken, id: appointment.id };
}

export async function approveAppointment(input: {
  appointmentId: string;
  actor: string;
  startAt: Date;
  durationMinutes: number;
  bufferMinutes: number;
  priceMinor: number;
  depositMinor?: number | null;
  customerNote?: string;
  withoutDeposit?: boolean;
  requiresAcceptance?: boolean;
}) {
  if (input.priceMinor < 0) throw new AppError("Price cannot be negative.", "PRICE");
  const settings = await getSettings();
  const appointment = await prisma.appointment.findUnique({
    where: { id: input.appointmentId },
    include: { client: true, service: true, quotes: true },
  });
  if (!appointment) throw new AppError("Request not found.", "NOT_FOUND", 404);
  if (!["REQUESTED", "AWAITING_CLIENT_RESPONSE"].includes(appointment.status)) {
    throw new AppError("This request is not waiting for approval.", "STATE");
  }

  const endAt = addMinutesUtc(input.startAt, input.durationMinutes + input.bufferMinutes);
  let depositMinor = 0;
  let withoutDeposit = Boolean(input.withoutDeposit) || !settings.depositsEnabled;
  if (!withoutDeposit) {
    depositMinor = computeDepositMinor({
      priceMinor: input.priceMinor,
      depositsEnabled: true,
      depositType: settings.depositType,
      depositAmountMinor: settings.depositAmountMinor,
      depositPercentBps: settings.depositPercentBps,
      overrideMinor: input.depositMinor,
    });
    if (depositMinor > input.priceMinor) depositMinor = input.priceMinor;
    if (depositMinor > 0 && depositMinor < CNG_MIN_AMOUNT_MINOR) {
      throw new AppError("Deposit must be greater than B$1.00 to use Cash N' Go.", "DEPOSIT_MIN");
    }
  }

  const requiresAcceptance =
    Boolean(input.requiresAcceptance) ||
    appointment.requestedStart.getTime() !== input.startAt.getTime() ||
    isQuoteRequired(appointment.service) ||
    (appointment.agreedPriceMinor != null && appointment.agreedPriceMinor !== input.priceMinor);

  const nextVersion = (appointment.quotes.at(-1)?.version ?? 0) + 1;
  const holdMinutes = settings.defaultHoldMinutes;
  const deadline = addMinutesUtc(new Date(), holdMinutes);

  try {
    await prisma.$transaction(async (tx) => {
      await expireHolds(tx);
      if (requiresAcceptance) {
        await tx.appointment.update({
          where: { id: appointment.id },
          data: {
            status: "AWAITING_CLIENT_RESPONSE",
            approvedStart: input.startAt,
            durationMinutes: input.durationMinutes,
            bufferMinutes: input.bufferMinutes,
            agreedPriceMinor: input.priceMinor,
            depositMinor,
            balanceMinor: input.priceMinor - depositMinor,
            customerNote: input.customerNote,
            withoutDepositApproval: withoutDeposit,
          },
        });
      } else if (withoutDeposit) {
        await reserveSlot({
          tx,
          kind: "CONFIRMED",
          startAt: input.startAt,
          endAt,
          appointmentId: appointment.id,
        });
        await tx.appointment.update({
          where: { id: appointment.id },
          data: {
            status: "CONFIRMED",
            paymentStatus: "WAIVED",
            approvedStart: input.startAt,
            durationMinutes: input.durationMinutes,
            bufferMinutes: input.bufferMinutes,
            agreedPriceMinor: input.priceMinor,
            depositMinor: 0,
            balanceMinor: input.priceMinor,
            customerNote: input.customerNote,
            withoutDepositApproval: true,
            holdExpiresAt: null,
            paymentDeadlineAt: null,
          },
        });
      } else {
        if (!livePaymentsAllowed() && !isDemoMode()) {
          throw new AppError(
            "Deposits are enabled but online payment is not configured. Do not approve until Cash N' Go is ready, or approve without a deposit.",
            "PAYMENTS_UNCONFIGURED",
          );
        }
        await reserveSlot({
          tx,
          kind: "HOLD",
          startAt: input.startAt,
          endAt,
          appointmentId: appointment.id,
        });
        await tx.appointment.update({
          where: { id: appointment.id },
          data: {
            status: "AWAITING_DEPOSIT",
            paymentStatus: "PENDING",
            approvedStart: input.startAt,
            durationMinutes: input.durationMinutes,
            bufferMinutes: input.bufferMinutes,
            agreedPriceMinor: input.priceMinor,
            depositMinor,
            balanceMinor: input.priceMinor - depositMinor,
            customerNote: input.customerNote,
            holdExpiresAt: deadline,
            paymentDeadlineAt: deadline,
            withoutDepositApproval: false,
          },
        });
      }
      await tx.quote.updateMany({
        where: { appointmentId: appointment.id, status: { in: ["PROPOSED", "DRAFT"] } },
        data: { status: "SUPERSEDED" },
      });
      await tx.quote.create({
        data: {
          appointmentId: appointment.id,
          version: nextVersion,
          status: requiresAcceptance ? "PROPOSED" : "ACCEPTED",
          serviceSnapshot: {
            serviceId: appointment.serviceId,
            serviceName: appointment.service.name,
            options: appointment.selectedOptions,
          } as Prisma.InputJsonValue,
          priceMinor: input.priceMinor,
          depositMinor,
          startAt: input.startAt,
          durationMinutes: input.durationMinutes,
          bufferMinutes: input.bufferMinutes,
          customerNote: input.customerNote,
          requiresAcceptance,
          acceptedAt: requiresAcceptance ? null : new Date(),
        },
      });
    });
  } catch (error) {
    if (slotUnavailable(error) || error instanceof SlotUnavailableError) {
      throw new SlotUnavailableError();
    }
    throw error;
  }

  await audit({
    actor: input.actor,
    action: requiresAcceptance ? "quote_proposed" : "appointment_approved",
    appointmentId: appointment.id,
    metadata: { priceMinor: input.priceMinor, depositMinor, withoutDeposit },
  });

  const refreshed = await prisma.appointment.findUniqueOrThrow({
    where: { id: appointment.id },
    include: { client: true, service: true },
  });
  await cancelScheduled(appointment.id, ["reminder", "deposit_reminder"]);
  await notifyClientAndOwner({
    appointmentId: appointment.id,
    clientEmail: refreshed.client.email,
    clientPhone: refreshed.client.phone,
    preference: refreshed.notificationPreference,
    clientEvent: requiresAcceptance ? "quote_revised" : "approval_deposit",
    clientTemplate: requiresAcceptance ? "quote_revised" : "approval_deposit",
    payload: {
      clientName: refreshed.client.name,
      serviceName: refreshed.service.name,
      startAt: input.startAt.toISOString(),
      depositMinor,
      bookingUrl: bookingUrl(refreshed.publicToken),
      quoteVersion: nextVersion,
    },
  });
  if (refreshed.status === "CONFIRMED") {
    await scheduleReminder(refreshed.id);
  }
  return refreshed;
}

export async function acceptQuote(publicToken: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { publicToken },
    include: { quotes: true, service: true, client: true },
  });
  if (!appointment) throw new AppError("Booking not found.", "NOT_FOUND", 404);
  const quote = appointment.quotes.find((q) => q.status === "PROPOSED");
  if (!quote || appointment.status !== "AWAITING_CLIENT_RESPONSE" || !appointment.approvedStart) {
    throw new AppError("There is no proposal waiting for you.", "STATE");
  }
  const settings = await getSettings();
  const startAt = quote.startAt;
  const endAt = addMinutesUtc(startAt, quote.durationMinutes + quote.bufferMinutes);
  const withoutDeposit = appointment.withoutDepositApproval || !settings.depositsEnabled;
  const deadline = addMinutesUtc(new Date(), settings.defaultHoldMinutes);

  try {
    await prisma.$transaction(async (tx) => {
      await expireHolds(tx);
      if (withoutDeposit) {
        await reserveSlot({ tx, kind: "CONFIRMED", startAt, endAt, appointmentId: appointment.id });
        await tx.appointment.update({
          where: { id: appointment.id },
          data: { status: "CONFIRMED", paymentStatus: "WAIVED" },
        });
      } else {
        if (!livePaymentsAllowed() && !isDemoMode()) {
          throw new AppError("Online payment is not configured yet.", "PAYMENTS_UNCONFIGURED");
        }
        await reserveSlot({ tx, kind: "HOLD", startAt, endAt, appointmentId: appointment.id });
        await tx.appointment.update({
          where: { id: appointment.id },
          data: {
            status: "AWAITING_DEPOSIT",
            paymentStatus: "PENDING",
            holdExpiresAt: deadline,
            paymentDeadlineAt: deadline,
          },
        });
      }
      await tx.quote.update({
        where: { id: quote.id },
        data: { status: "ACCEPTED", acceptedAt: new Date() },
      });
    });
  } catch (error) {
    if (slotUnavailable(error)) throw new SlotUnavailableError();
    throw error;
  }
  await audit({ actor: "client", action: "quote_accepted", appointmentId: appointment.id });
  return prisma.appointment.findUniqueOrThrow({ where: { id: appointment.id } });
}

export async function declineAppointment(appointmentId: string, actor: string, note?: string) {
  const appt = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "DECLINED", customerNote: note, holdExpiresAt: null },
    include: { client: true, service: true },
  });
  await prisma.calendarSlot.deleteMany({ where: { appointmentId } });
  await cancelScheduled(appointmentId);
  await audit({ actor, action: "declined", appointmentId, metadata: { note } });
  await notifyClientAndOwner({
    appointmentId,
    clientEmail: appt.client.email,
    clientPhone: appt.client.phone,
    preference: appt.notificationPreference,
    clientEvent: "cancelled",
    clientTemplate: "cancelled",
    payload: {
      clientName: appt.client.name,
      serviceName: appt.service.name,
      bookingUrl: bookingUrl(appt.publicToken),
    },
  });
}

export async function startPayment(publicToken: string, payFull = false) {
  await expireHolds();
  const appointment = await prisma.appointment.findUnique({
    where: { publicToken },
    include: { quotes: true, verifiedPayments: true, service: true },
  });
  if (!appointment) throw new AppError("Booking not found.", "NOT_FOUND", 404);
  if (appointment.status !== "AWAITING_DEPOSIT") {
    throw new AppError("This booking is not awaiting a deposit.", "STATE");
  }
  if (appointment.holdExpiresAt && appointment.holdExpiresAt < new Date()) {
    throw new AppError("This hold has expired. Please request a new time.", "EXPIRED");
  }
  if (appointment.verifiedPayments.some((p) => !p.exceptionReason)) {
    throw new AppError("A payment is already recorded.", "PAID");
  }
  const quote = [...appointment.quotes].reverse().find((q) => q.status === "ACCEPTED") ?? appointment.quotes.at(-1);
  const amount = payFull ? appointment.agreedPriceMinor : appointment.depositMinor;
  if (!amount || amount <= 0) throw new AppError("No amount is due online.", "AMOUNT");
  if (!livePaymentsAllowed() && !isDemoMode()) {
    throw new AppError("Online payment is not configured yet.", "PAYMENTS_UNCONFIGURED");
  }
  const attempt = await prisma.paymentAttempt.create({
    data: {
      appointmentId: appointment.id,
      quoteId: quote?.id,
      orderNumber: orderNumber(),
      amountMinor: amount,
      payFull,
      passphrase: nanoid(12),
      status: "CREATED",
    },
  });
  const hosted = await createHostedPaymentUrl({
    orderNumber: attempt.orderNumber,
    amountMinor: attempt.amountMinor,
    passphrase: attempt.passphrase,
  });
  await prisma.paymentAttempt.update({
    where: { id: attempt.id },
    data: { redirectUrl: hosted.redirectUrl, status: "REDIRECTED" },
  });
  return { redirectUrl: hosted.redirectUrl, orderNumber: attempt.orderNumber };
}

export async function ownerCreateAppointment(input: {
  actor: string;
  name: string;
  phone: string;
  email?: string;
  serviceId: string;
  startAt: Date;
  durationMinutes: number;
  bufferMinutes: number;
  priceMinor: number;
  notes?: string;
  collectDeposit?: boolean;
}) {
  const phone = normalizePhone(input.phone);
  if (!phone) throw new AppError("Enter a valid mobile number.", "PHONE");
  const service = await prisma.service.findUnique({ where: { id: input.serviceId } });
  if (!service) throw new AppError("Service not found.", "SERVICE");
  let client = await prisma.client.findFirst({ where: { phone } });
  if (!client) {
    client = await prisma.client.create({
      data: { name: input.name.trim(), phone, email: input.email || null, isDemo: isDemoMode() },
    });
  }
  const publicToken = token();
  const endAt = addMinutesUtc(input.startAt, input.durationMinutes + input.bufferMinutes);
  try {
    const appointment = await prisma.$transaction(async (tx) => {
      const created = await tx.appointment.create({
        data: {
          publicToken,
          clientId: client!.id,
          path: "OWNER",
          serviceId: service.id,
          requestedStart: input.startAt,
          approvedStart: input.startAt,
          durationMinutes: input.durationMinutes,
          bufferMinutes: input.bufferMinutes,
          agreedPriceMinor: input.priceMinor,
          notes: input.notes,
          policyAcknowledged: true,
          status: "CONFIRMED",
          paymentStatus: "OFFLINE_RECORDED",
          withoutDepositApproval: !input.collectDeposit,
          isDemo: isDemoMode(),
        },
      });
      await reserveSlot({
        tx,
        kind: "CONFIRMED",
        startAt: input.startAt,
        endAt,
        appointmentId: created.id,
        title: `${input.name} · ${service.name}`,
      });
      return created;
    });
    await audit({ actor: input.actor, action: "owner_created", appointmentId: appointment.id });
    return appointment;
  } catch (error) {
    if (slotUnavailable(error)) throw new SlotUnavailableError();
    throw error;
  }
}

export async function ownerBlockTime(input: {
  actor: string;
  startAt: Date;
  endAt: Date;
  title: string;
}) {
  try {
    await prisma.$transaction(async (tx) => {
      await reserveSlot({
        tx,
        kind: "BLOCKED",
        startAt: input.startAt,
        endAt: input.endAt,
        title: input.title,
      });
    });
    await audit({ actor: input.actor, action: "block_created", metadata: { title: input.title } });
  } catch (error) {
    if (slotUnavailable(error)) throw new SlotUnavailableError();
    throw error;
  }
}

export async function requestCancellation(publicToken: string, reason?: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { publicToken },
    include: { verifiedPayments: true, client: true, service: true },
  });
  if (!appointment) throw new AppError("Booking not found.", "NOT_FOUND", 404);
  const paid = appointment.verifiedPayments.find((p) => !p.exceptionReason);
  await prisma.$transaction(async (tx) => {
    await tx.calendarSlot.deleteMany({ where: { appointmentId: appointment.id } });
    await tx.appointment.update({
      where: { id: appointment.id },
      data: { status: "CANCELLED", cancellationReason: reason ?? "Client requested cancellation" },
    });
  });
  await cancelScheduled(appointment.id);
  if (paid) {
    await issueRetainedCredit({
      clientId: appointment.clientId,
      appointmentId: appointment.id,
      amountMinor: paid.grossAmountMinor,
      sourcePaymentId: paid.id,
      actor: "client",
    });
  }
  await audit({ actor: "client", action: "client_cancel", appointmentId: appointment.id });
  await notifyClientAndOwner({
    appointmentId: appointment.id,
    clientEmail: appointment.client.email,
    clientPhone: appointment.client.phone,
    preference: appointment.notificationPreference,
    clientEvent: "cancelled",
    clientTemplate: "cancelled",
    payload: {
      clientName: appointment.client.name,
      serviceName: appointment.service.name,
      bookingUrl: bookingUrl(appointment.publicToken),
    },
  });
}

export async function requestReschedule(publicToken: string, newStart: Date) {
  const appointment = await prisma.appointment.findUnique({
    where: { publicToken },
    include: { client: true, service: true },
  });
  if (!appointment) throw new AppError("Booking not found.", "NOT_FOUND", 404);
  await prisma.calendarSlot.deleteMany({ where: { appointmentId: appointment.id } });
  await prisma.appointment.update({
    where: { id: appointment.id },
    data: {
      status: "REQUESTED",
      requestedStart: newStart,
      approvedStart: null,
      holdExpiresAt: null,
      paymentStatus: appointment.paymentStatus === "PAID" ? appointment.paymentStatus : "NONE",
    },
  });
  await cancelScheduled(appointment.id, ["reminder", "deposit_reminder", "hold_expiring"]);
  await audit({ actor: "client", action: "reschedule_requested", appointmentId: appointment.id });
  const owner = await prisma.owner.findFirst({ where: { isDemo: isDemoMode() } });
  await notifyClientAndOwner({
    appointmentId: appointment.id,
    clientEmail: appointment.client.email,
    clientPhone: appointment.client.phone,
    ownerEmail: owner?.email,
    preference: appointment.notificationPreference,
    clientEvent: "reschedule_update",
    clientTemplate: "reschedule_update",
    payload: {
      clientName: appointment.client.name,
      serviceName: appointment.service.name,
      startAt: newStart.toISOString(),
      bookingUrl: bookingUrl(appointment.publicToken),
    },
    ownerEvent: "new_request",
    ownerTemplate: "request_received_owner",
  });
}

export async function applyCreditTowardDeposit(appointmentId: string, actor: string) {
  const appt = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!appt || appt.depositMinor == null) return 0;
  const applied = await allocateCredit({
    clientId: appt.clientId,
    targetAppointmentId: appointmentId,
    amountMinor: appt.depositMinor,
    actor,
  });
  if (applied >= appt.depositMinor && appt.status === "AWAITING_DEPOSIT") {
    await prisma.$transaction(async (tx) => {
      await tx.calendarSlot.updateMany({
        where: { appointmentId },
        data: { kind: "CONFIRMED" },
      });
      await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          status: "CONFIRMED",
          paymentStatus: "PAID",
          balanceMinor: Math.max(0, (appt.agreedPriceMinor ?? 0) - applied),
        },
      });
    });
    await scheduleReminder(appointmentId);
  }
  return applied;
}

export async function recordOfflinePayment(input: {
  appointmentId: string;
  amountMinor: number;
  actor: string;
  note: string;
}) {
  const appt = await prisma.appointment.findUnique({ where: { id: input.appointmentId } });
  if (!appt) throw new AppError("Not found", "NOT_FOUND", 404);
  await prisma.verifiedPayment.create({
    data: {
      cngTransactionId: `offline-${nanoid(12)}`,
      paymentAttemptId: (
        await prisma.paymentAttempt.create({
          data: {
            appointmentId: appt.id,
            orderNumber: `OFFLINE-${nanoid(8)}`,
            amountMinor: input.amountMinor,
            passphrase: "offline",
            status: "VERIFIED",
          },
        })
      ).id,
      appointmentId: appt.id,
      grossAmountMinor: input.amountMinor,
      provider: "offline",
      source: "owner-recorded",
      rawPayload: { note: input.note, notCngVerified: true },
    },
  });
  await prisma.appointment.update({
    where: { id: appt.id },
    data: { paymentStatus: "OFFLINE_RECORDED" },
  });
  await audit({
    actor: input.actor,
    action: "offline_payment",
    appointmentId: appt.id,
    metadata: { amountMinor: input.amountMinor, note: input.note },
  });
}

export async function scheduleReminder(appointmentId: string) {
  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { client: true, service: true },
  });
  if (!appt?.approvedStart) return;
  const settings = await getSettings();
  const prefs = (settings.notificationPrefs ?? {}) as { reminderHours?: number[] };
  const hours = prefs.reminderHours ?? [24];
  await cancelScheduled(appointmentId, ["reminder"]);
  for (const h of hours) {
    const when = new Date(appt.approvedStart.getTime() - h * 60 * 60 * 1000);
    if (when < new Date()) continue;
    await enqueueNotification(prisma, {
      eventType: "reminder",
      channel: appt.notificationPreference === "sms" ? "SMS" : "EMAIL",
      recipient: appt.notificationPreference === "sms" ? appt.client.phone : appt.client.email || appt.client.phone,
      appointmentId,
      templateKey: "reminder",
      payload: {
        clientName: appt.client.name,
        serviceName: appt.service.name,
        startAt: appt.approvedStart.toISOString(),
        bookingUrl: bookingUrl(appt.publicToken),
      },
      scheduledFor: when,
      idempotencyKey: `reminder:${appointmentId}:${h}h:${appt.approvedStart.toISOString()}`,
    });
  }
}

export async function markStatus(appointmentId: string, status: "COMPLETED" | "NO_SHOW", actor: string) {
  await prisma.appointment.update({ where: { id: appointmentId }, data: { status } });
  await audit({ actor, action: `status_${status.toLowerCase()}`, appointmentId });
}

export async function ownerCancel(appointmentId: string, actor: string, note: string) {
  const appt = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: "CANCELLED",
      ownerCancellationFlag: true,
      cancellationReason: note,
    },
    include: { client: true, service: true, verifiedPayments: true },
  });
  await prisma.calendarSlot.deleteMany({ where: { appointmentId } });
  await cancelScheduled(appointmentId);
  await audit({ actor, action: "owner_cancel_manual_resolution", appointmentId, metadata: { note } });
  return appt;
}

void renderTemplate;
void clientCreditBalance;
