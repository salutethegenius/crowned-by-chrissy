import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { addMinutesUtc, businessYmd, hmToMinutes, minutesToHm, weekdayInBusinessTz, zonedDateTime } from "./time";
import { getSettings, workingDaysList, closuresList } from "./settings";

export async function expireHolds(tx: Prisma.TransactionClient | typeof prisma = prisma) {
  const expired = await tx.appointment.findMany({
    where: {
      status: "AWAITING_DEPOSIT",
      holdExpiresAt: { lt: new Date() },
    },
    select: { id: true },
  });
  if (!expired.length) return expired.map((a) => a.id);
  const ids = expired.map((a) => a.id);
  await tx.calendarSlot.deleteMany({ where: { appointmentId: { in: ids } } });
  await tx.appointment.updateMany({
    where: { id: { in: ids } },
    data: { status: "EXPIRED", paymentStatus: "NONE" },
  });
  await tx.notificationMessage.updateMany({
    where: {
      appointmentId: { in: ids },
      status: { in: ["QUEUED"] },
      eventType: { in: ["deposit_reminder", "hold_expiring"] },
    },
    data: { status: "CANCELLED" },
  });
  return ids;
}

function isExclusionError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "23P01"
    ? true
    : typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: string }).code === "23P01";
}

export async function reserveSlot(params: {
  tx: Prisma.TransactionClient;
  kind: "HOLD" | "CONFIRMED" | "BLOCKED";
  startAt: Date;
  endAt: Date;
  appointmentId?: string;
  title?: string;
}) {
  await expireHolds(params.tx);
  try {
    return await params.tx.calendarSlot.create({
      data: {
        kind: params.kind,
        startAt: params.startAt,
        endAt: params.endAt,
        appointmentId: params.appointmentId,
        title: params.title,
      },
    });
  } catch (error) {
    if (isExclusionError(error) || (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) {
      throw error;
    }
    const message = error instanceof Error ? error.message : "";
    if (message.includes("calendar_slots_no_overlap") || message.includes("exclusion")) {
      const exclusion = new Prisma.PrismaClientKnownRequestError("overlap", {
        code: "23P01",
        clientVersion: "6",
      });
      throw exclusion;
    }
    throw error;
  }
}

export function slotUnavailable(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "23P01" || error.code === "P2002";
  }
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("calendar_slots_no_overlap") || message.includes("exclusion") || message.includes("23P01");
}

export async function listOpenSlots(params: {
  durationMinutes: number;
  bufferMinutes: number;
  from?: Date;
  days?: number;
}) {
  const settings = await getSettings();
  const days = workingDaysList(settings);
  const closures = new Set(closuresList(settings));
  if (!days.length || !settings.requestsOpen) return [];
  await expireHolds();
  const duration = params.durationMinutes + params.bufferMinutes;
  const startSearch = params.from ?? new Date();
  const endSearch = addMinutesUtc(startSearch, 60 * 24 * (params.days ?? 28));
  const busy = await prisma.calendarSlot.findMany({
    where: {
      startAt: { lt: endSearch },
      endAt: { gt: startSearch },
    },
  });
  const results: { start: Date; labelDate: string; labelTime: string }[] = [];
  const openStart = hmToMinutes(settings.operatingHoursStart);
  const openEnd = hmToMinutes(settings.operatingHoursEnd);
  const interval = settings.slotIntervalMinutes;
  const cursor = new Date(startSearch);
  cursor.setUTCHours(0, 0, 0, 0);
  for (let d = 0; d < (params.days ?? 28); d++) {
    const day = addMinutesUtc(startSearch, d * 24 * 60);
    const ymd = businessYmd(day);
    const weekday = weekdayInBusinessTz(day);
    if (!days.includes(weekday) || closures.has(ymd)) continue;
    for (let m = openStart; m + params.durationMinutes <= openEnd; m += interval) {
      const start = zonedDateTime(ymd, minutesToHm(m));
      if (start < startSearch) continue;
      const end = addMinutesUtc(start, duration);
      const overlaps = busy.some((slot) => slot.startAt < end && slot.endAt > start);
      if (!overlaps) {
        results.push({
          start,
          labelDate: ymd,
          labelTime: minutesToHm(m),
        });
      }
    }
  }
  return results;
}

export async function assertSlotFree(tx: Prisma.TransactionClient, startAt: Date, endAt: Date, ignoreAppointmentId?: string) {
  await expireHolds(tx);
  const clash = await tx.calendarSlot.findFirst({
    where: {
      startAt: { lt: endAt },
      endAt: { gt: startAt },
      ...(ignoreAppointmentId ? { NOT: { appointmentId: ignoreAppointmentId } } : {}),
    },
  });
  return !clash;
}
