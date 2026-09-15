import "server-only";

import { Prisma } from "@prisma/client";
import { Resend } from "resend";
import { prisma } from "./db";
import { isDemoMode, notificationProviders } from "./env";
import { formatBusiness } from "./time";
import { formatMoney } from "./money";
import { renderEmailHtml } from "./email";
import { SITE_NAME } from "./site";

type EnqueueInput = {
  eventType: string;
  channel: "EMAIL" | "SMS" | "PUSH" | "IN_APP";
  recipient: string;
  appointmentId?: string;
  templateKey: string;
  payload: Record<string, unknown>;
  scheduledFor?: Date;
  idempotencyKey: string;
};

export async function enqueueNotification(
  tx: Prisma.TransactionClient | typeof prisma,
  input: EnqueueInput,
) {
  try {
    await tx.notificationMessage.create({
      data: {
        eventType: input.eventType,
        channel: input.channel,
        recipient: input.recipient,
        appointmentId: input.appointmentId,
        templateKey: input.templateKey,
        payload: input.payload as Prisma.InputJsonValue,
        scheduledFor: input.scheduledFor ?? new Date(),
        idempotencyKey: input.idempotencyKey,
        isDemo: isDemoMode(),
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return;
    }
    throw error;
  }
}

export async function cancelScheduled(appointmentId: string, eventTypes?: string[]) {
  await prisma.notificationMessage.updateMany({
    where: {
      appointmentId,
      status: "QUEUED",
      ...(eventTypes ? { eventType: { in: eventTypes } } : {}),
    },
    data: { status: "CANCELLED" },
  });
}

export function renderTemplate(
  key: string,
  payload: Record<string, unknown>,
): { subject: string; body: string } {
  const name = String(payload.clientName ?? "there");
  const when = payload.startAt ? formatBusiness(new Date(String(payload.startAt))) : "";
  const service = String(payload.serviceName ?? "your appointment");
  const deposit = payload.depositMinor != null ? formatMoney(Number(payload.depositMinor)) : "";
  const link = String(payload.bookingUrl ?? "");
  const templates: Record<string, { subject: string; body: string }> = {
    request_received_client: {
      subject: "Your request is with Chrissy",
      body: `Hi ${name}, your ${service} request is with Chrissy. Once she approves your appointment, you’ll receive a deposit payment link to secure your spot.${link ? `\n\nCheck your request: ${link}` : ""}`,
    },
    request_received_owner: {
      subject: "New appointment request",
      body: `${name} requested ${service}${when ? ` for ${when}` : ""}. Review it in your dashboard.`,
    },
    approval_deposit: {
      subject: "Chrissy approved your appointment",
      body: `Hi ${name}, Chrissy approved your ${service}${when ? ` on ${when}` : ""}.${deposit ? ` Pay your ${deposit} deposit to secure your spot.` : ""}${link ? `\n\nPay / view details: ${link}` : ""}`,
    },
    quote_revised: {
      subject: "Chrissy suggested a change",
      body: `Hi ${name}, Chrissy proposed an update to your ${service} request. Please review and accept it before paying.${link ? `\n\nReview: ${link}` : ""}`,
    },
    payment_confirmed: {
      subject: "Your appointment is confirmed",
      body: `Hi ${name}, your deposit is in and your ${service} appointment${when ? ` on ${when}` : ""} is confirmed. See you then.${link ? `\n\nDetails: ${link}` : ""}`,
    },
    reminder: {
      subject: "Reminder: your Crowned by Chrissy appointment",
      body: `Hi ${name}, this is a reminder that your ${service} appointment is ${when}.${link ? `\n\nDetails: ${link}` : ""}`,
    },
    hold_expired: {
      subject: "Your appointment hold expired",
      body: `Hi ${name}, the window to pay your deposit has passed, so that time was released. You’re welcome to request a new appointment.${link ? `\n\nRequest again from: ${link}` : ""}`,
    },
    cancelled: {
      subject: "Appointment update from Crowned by Chrissy",
      body: `Hi ${name}, your ${service} appointment was cancelled.${link ? `\n\nDetails: ${link}` : ""}`,
    },
    reschedule_update: {
      subject: "Reschedule update",
      body: `Hi ${name}, your reschedule request for ${service} has been updated.${link ? `\n\nDetails: ${link}` : ""}`,
    },
  };
  return templates[key] ?? { subject: "Crowned by Chrissy", body: String(payload.body ?? "") };
}

export async function processOutbox(limit = 25) {
  const due = await prisma.notificationMessage.findMany({
    where: { status: "QUEUED", scheduledFor: { lte: new Date() } },
    orderBy: { scheduledFor: "asc" },
    take: limit,
  });
  const providers = notificationProviders();
  for (const msg of due) {
    const rendered = renderTemplate(msg.templateKey, msg.payload as Record<string, unknown>);
    try {
      if (msg.channel === "IN_APP") {
        await prisma.notificationMessage.update({
          where: { id: msg.id },
          data: { status: "SENT", sentAt: new Date(), provider: "in-app", attempts: { increment: 1 } },
        });
        continue;
      }
      if (isDemoMode()) {
        await prisma.notificationMessage.update({
          where: { id: msg.id },
          data: {
            status: "SENT",
            sentAt: new Date(),
            provider: "demo-logger",
            attempts: { increment: 1 },
            error: "Demo mode: message stored only. Not delivered to a real customer.",
          },
        });
        continue;
      }
      if (msg.channel === "EMAIL") {
        if (!providers.resend) {
          await prisma.notificationMessage.update({
            where: { id: msg.id },
            data: {
              status: "FAILED",
              error: "Email provider is not configured.",
              attempts: { increment: 1 },
            },
          });
          continue;
        }
        const id = await sendResend(msg.recipient, rendered.subject, rendered.body);
        await prisma.notificationMessage.update({
          where: { id: msg.id },
          data: { status: "SENT", sentAt: new Date(), provider: "resend", providerMessageId: id, attempts: { increment: 1 } },
        });
        continue;
      }
      if (msg.channel === "SMS") {
        if (!providers.twilio) {
          await prisma.notificationMessage.update({
            where: { id: msg.id },
            data: {
              status: "FAILED",
              error: "SMS provider is not configured.",
              attempts: { increment: 1 },
            },
          });
          continue;
        }
        const id = await sendTwilio(msg.recipient, rendered.body);
        await prisma.notificationMessage.update({
          where: { id: msg.id },
          data: { status: "SENT", sentAt: new Date(), provider: "twilio", providerMessageId: id, attempts: { increment: 1 } },
        });
        continue;
      }
      if (msg.channel === "PUSH") {
        if (!providers.push) {
          await prisma.notificationMessage.update({
            where: { id: msg.id },
            data: { status: "FAILED", error: "Push is not configured.", attempts: { increment: 1 } },
          });
          continue;
        }
        await prisma.notificationMessage.update({
          where: { id: msg.id },
          data: { status: "FAILED", error: "Push delivery adapter is not fully configured.", attempts: { increment: 1 } },
        });
      }
    } catch (error) {
      await prisma.notificationMessage.update({
        where: { id: msg.id },
        data: {
          status: "FAILED",
          error: error instanceof Error ? error.message : "Delivery failed",
          attempts: { increment: 1 },
        },
      });
    }
  }
}

async function sendResend(to: string, subject: string, body: string) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  if (!apiKey || !from) {
    throw new Error("Email provider is not configured.");
  }
  const resend = new Resend(apiKey);
  const replyTo = process.env.RESEND_REPLY_TO?.trim();
  const { data, error } = await resend.emails.send({
    from,
    to,
    subject,
    text: body,
    html: renderEmailHtml({ subject, body }),
    ...(replyTo ? { replyTo } : {}),
  });
  if (error) {
    throw new Error(error.message || "Resend rejected the message.");
  }
  return data?.id ?? "resend";
}

export async function sendTestEmail(to: string) {
  const providers = notificationProviders();
  if (!providers.resend) {
    throw new Error("Set RESEND_API_KEY and RESEND_FROM_EMAIL before sending a test.");
  }
  const subject = `Test email from ${SITE_NAME}`;
  const body = `This is a test from the owner dashboard. If you received it, Resend is ready for appointment notifications.`;
  const id = await sendResend(to, subject, body);
  await prisma.notificationMessage.create({
    data: {
      eventType: "test_email",
      channel: "EMAIL",
      recipient: to,
      templateKey: "test_email",
      payload: { body, subject },
      status: "SENT",
      sentAt: new Date(),
      provider: "resend",
      providerMessageId: id,
      isDemo: isDemoMode(),
      idempotencyKey: `test_email:${Date.now()}:${to}`,
    },
  });
  return id;
}

async function sendTwilio(to: string, body: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  const from = process.env.TWILIO_FROM_NUMBER!;
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: to, From: from, Body: body }),
  });
  if (!res.ok) throw new Error(`Twilio rejected the message (${res.status}).`);
  const json = (await res.json()) as { sid?: string };
  return json.sid ?? "twilio";
}

export async function retryFailed(id: string) {
  const msg = await prisma.notificationMessage.findUnique({ where: { id } });
  if (!msg || msg.status !== "FAILED") throw new Error("That message cannot be retried.");
  await prisma.notificationMessage.update({
    where: { id },
    data: { status: "QUEUED", error: null, scheduledFor: new Date() },
  });
  await processOutbox(5);
}

export function whatsappHref(phone: string, text: string) {
  const digits = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
