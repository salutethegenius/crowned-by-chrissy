"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { submitAppointmentRequest } from "@/lib/booking";
import { listOpenSlots } from "@/lib/availability";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { savePrivateUpload } from "@/lib/storage";
import { zonedDateTime } from "@/lib/time";
import { AppError } from "@/lib/errors";
import { headers } from "next/headers";

const requestSchema = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().min(7).max(20),
  email: z.string().email().optional().or(z.literal("")),
  serviceId: z.string(),
  selectedOptions: z.string(),
  date: z.string(),
  time: z.string(),
  altDate: z.string().optional(),
  altTime: z.string().optional(),
  notes: z.string().max(800).optional(),
  lookMediaId: z.string().optional(),
  policy: z.literal("on"),
  notify: z.enum(["email", "sms", "link"]),
  path: z.enum(["DISCOVERY", "DIRECT"]),
  website: z.string().max(0).optional(),
});

export async function getAvailabilityAction(serviceId: string) {
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service?.durationMinutes) return { slots: [] as { start: string; labelDate: string; labelTime: string }[], reason: "duration" };
  const slots = await listOpenSlots({
    durationMinutes: service.durationMinutes,
    bufferMinutes: service.bufferMinutes,
  });
  return {
    slots: slots.slice(0, 80).map((s) => ({
      start: s.start.toISOString(),
      labelDate: s.labelDate,
      labelTime: s.labelTime,
    })),
    reason: null as string | null,
  };
}

export async function submitRequestAction(formData: FormData) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0] || "local";
  const limited = await rateLimit(`book:${ip}`, 8);
  if (!limited.ok) return { error: "Please wait a few minutes before sending another request." };

  const parsed = requestSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email") || "",
    serviceId: formData.get("serviceId"),
    selectedOptions: formData.get("selectedOptions") || "{}",
    date: formData.get("date"),
    time: formData.get("time"),
    altDate: formData.get("altDate") || "",
    altTime: formData.get("altTime") || "",
    notes: formData.get("notes") || "",
    lookMediaId: formData.get("lookMediaId") || "",
    policy: formData.get("policy"),
    notify: formData.get("notify"),
    path: formData.get("path"),
    website: formData.get("website") || "",
  });
  if (!parsed.success) {
    return { error: "Please check the highlighted fields and try again." };
  }
  if (parsed.data.website) return { error: "Unable to send that request." };

  let inspirationMediaId: string | undefined;
  const photo = formData.get("inspiration") as File | null;
  if (photo && photo.size > 0) {
    const saved = await savePrivateUpload(photo, "image");
    const media = await prisma.media.create({
      data: {
        slug: `insp-${Date.now()}`,
        kind: "IMAGE",
        visibility: "PRIVATE_INSPIRATION",
        originalPath: saved.relativePath,
        alt: "Private inspiration photo",
        archived: true,
      },
    });
    inspirationMediaId = media.id;
  }

  try {
    const result = await submitAppointmentRequest({
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email || undefined,
      serviceId: parsed.data.serviceId,
      selectedOptions: JSON.parse(parsed.data.selectedOptions),
      requestedStart: zonedDateTime(parsed.data.date, parsed.data.time),
      alternativeStart:
        parsed.data.altDate && parsed.data.altTime
          ? zonedDateTime(parsed.data.altDate, parsed.data.altTime)
          : null,
      notes: parsed.data.notes,
      inspirationMediaId,
      lookMediaId: parsed.data.lookMediaId || undefined,
      policyAcknowledged: true,
      notificationPreference: parsed.data.notify,
      path: parsed.data.path,
    });
    revalidatePath("/owner");
    redirect(`/appointments/${result.publicToken}?new=1`);
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    throw error;
  }
}
