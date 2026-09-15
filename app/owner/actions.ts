"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import {
  approveAppointment,
  declineAppointment,
  ownerBlockTime,
  ownerCreateAppointment,
  recordOfflinePayment,
  markStatus,
  ownerCancel,
} from "@/lib/booking";
import { zonedDateTime } from "@/lib/time";
import { dollarsToMinor } from "@/lib/money";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/db";
import { retryFailed, sendTestEmail } from "@/lib/notifications";

export async function approveOwnerAction(formData: FormData) {
  const owner = await requireOwner();
  const id = String(formData.get("id"));
  try {
    await approveAppointment({
      appointmentId: id,
      actor: owner.email,
      startAt: zonedDateTime(String(formData.get("date")), String(formData.get("time"))),
      durationMinutes: Number(formData.get("duration")),
      bufferMinutes: Number(formData.get("buffer")),
      priceMinor: dollarsToMinor(Number(formData.get("price"))),
      depositMinor: formData.get("deposit") ? dollarsToMinor(Number(formData.get("deposit"))) : null,
      customerNote: String(formData.get("note") || "") || undefined,
      withoutDeposit: formData.get("withoutDeposit") === "on",
      requiresAcceptance: formData.get("needsAcceptance") === "on",
    });
    revalidatePath("/owner");
    redirect("/owner/requests");
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    throw error;
  }
}

export async function declineOwnerAction(id: string, note: string) {
  const owner = await requireOwner();
  await declineAppointment(id, owner.email, note);
  revalidatePath("/owner/requests");
  redirect("/owner/requests");
}

export async function createWalkInAction(formData: FormData) {
  const owner = await requireOwner();
  try {
    await ownerCreateAppointment({
      actor: owner.email,
      name: String(formData.get("name")),
      phone: String(formData.get("phone")),
      email: String(formData.get("email") || "") || undefined,
      serviceId: String(formData.get("serviceId")),
      startAt: zonedDateTime(String(formData.get("date")), String(formData.get("time"))),
      durationMinutes: Number(formData.get("duration")),
      bufferMinutes: Number(formData.get("buffer") || 15),
      priceMinor: dollarsToMinor(Number(formData.get("price"))),
      notes: String(formData.get("notes") || "") || undefined,
    });
    revalidatePath("/owner/calendar");
    redirect("/owner/calendar");
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    throw error;
  }
}

export async function blockTimeAction(formData: FormData) {
  const owner = await requireOwner();
  try {
    await ownerBlockTime({
      actor: owner.email,
      startAt: zonedDateTime(String(formData.get("date")), String(formData.get("start"))),
      endAt: zonedDateTime(String(formData.get("date")), String(formData.get("end"))),
      title: String(formData.get("title") || "Blocked"),
    });
    revalidatePath("/owner/calendar");
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    throw error;
  }
}

export async function saveServiceAction(formData: FormData) {
  await requireOwner();
  const id = String(formData.get("id"));
  await prisma.service.update({
    where: { id },
    data: {
      name: String(formData.get("name")),
      description: String(formData.get("description") || ""),
      displayNote: String(formData.get("displayNote") || "") || null,
      pricingType: String(formData.get("pricingType")) as "FIXED" | "STARTING_FROM" | "RANGE" | "QUOTE_REQUIRED",
      priceMinMinor: formData.get("priceMin") ? dollarsToMinor(Number(formData.get("priceMin"))) : null,
      priceMaxMinor: formData.get("priceMax") ? dollarsToMinor(Number(formData.get("priceMax"))) : null,
      priceMaxOpenEnded: formData.get("openEnded") === "on",
      durationMinutes: formData.get("duration") ? Number(formData.get("duration")) : null,
      bufferMinutes: Number(formData.get("buffer") || 0),
      active: formData.get("active") === "on",
      displayOrder: Number(formData.get("displayOrder") || 0),
    },
  });
  revalidatePath("/owner/services");
  revalidatePath("/services");
}

export async function saveSettingsAction(formData: FormData) {
  await requireOwner();
  const days = formData.getAll("workingDays").map(Number);
  await prisma.businessSettings.update({
    where: { id: "singleton" },
    data: {
      operatingHoursStart: String(formData.get("hoursStart") || "08:00"),
      operatingHoursEnd: String(formData.get("hoursEnd") || "20:00"),
      workingDays: days,
      requestsOpen: formData.get("requestsOpen") === "on" && days.length > 0,
      depositsEnabled: formData.get("depositsEnabled") === "on",
      depositType: formData.get("depositType") === "PERCENTAGE" ? "PERCENTAGE" : "FIXED",
      depositAmountMinor: formData.get("depositAmount") ? dollarsToMinor(Number(formData.get("depositAmount"))) : null,
      depositPercentBps: formData.get("depositPercent") ? Number(formData.get("depositPercent")) * 100 : null,
      defaultHoldMinutes: Number(formData.get("holdMinutes") || 1440),
      address: String(formData.get("address") || "") || null,
      addressVisible: formData.get("addressVisible") === "on",
      biography: String(formData.get("biography") || "") || null,
      fullPaymentOptional: formData.get("fullPaymentOptional") === "on",
    },
  });
  revalidatePath("/");
  revalidatePath("/owner/settings");
}

export async function offlinePayAction(formData: FormData) {
  const owner = await requireOwner();
  await recordOfflinePayment({
    appointmentId: String(formData.get("id")),
    amountMinor: dollarsToMinor(Number(formData.get("amount"))),
    actor: owner.email,
    note: String(formData.get("note") || "Offline payment"),
  });
  revalidatePath("/owner/payments");
}

export async function retryNoticeAction(id: string) {
  await requireOwner();
  await retryFailed(id);
  revalidatePath("/owner/notifications");
}

export async function sendTestEmailAction(_prev: { ok?: string; error?: string } | null, formData: FormData) {
  try {
    const owner = await requireOwner();
    const to = String(formData.get("email") || owner.email).trim();
    if (!to) return { error: "Enter an email address." };
    await sendTestEmail(to);
    revalidatePath("/owner/notifications");
    return { ok: `Sent a test email to ${to}. Check that inbox (and spam) for the branded message.` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not send the test email." };
  }
}

export async function completeAction(id: string, status: "COMPLETED" | "NO_SHOW") {
  const owner = await requireOwner();
  await markStatus(id, status, owner.email);
  revalidatePath("/owner/calendar");
}

export async function ownerCancelAction(id: string, note: string) {
  const owner = await requireOwner();
  await ownerCancel(id, owner.email, note);
  revalidatePath("/owner/calendar");
}
