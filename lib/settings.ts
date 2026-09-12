import "server-only";

import { prisma } from "./db";
import { cngConfig, isDemoMode, notificationProviders } from "./env";
import type { BusinessSettings } from "@prisma/client";

export async function getSettings(): Promise<BusinessSettings> {
  const existing = await prisma.businessSettings.findUnique({ where: { id: "singleton" } });
  if (existing) return existing;
  return prisma.businessSettings.create({ data: { id: "singleton" } });
}

export function workingDaysList(settings: BusinessSettings): number[] {
  const days = settings.workingDays as number[] | null;
  return Array.isArray(days) ? days.map(Number).filter(Boolean) : [];
}

export function closuresList(settings: BusinessSettings): string[] {
  const closures = settings.closures as string[] | null;
  return Array.isArray(closures) ? closures : [];
}

export function bookingConfigured(settings: BusinessSettings) {
  return workingDaysList(settings).length > 0 && settings.requestsOpen;
}

export async function publicSiteConfig() {
  const settings = await getSettings();
  const demo = isDemoMode();
  const cng = cngConfig();
  const notices = notificationProviders();
  const days = workingDaysList(settings);
  const copy = (settings.publicCopy ?? {}) as Record<string, string>;
  return {
    demo,
    name: settings.name,
    city: settings.locationCity,
    region: settings.locationRegion,
    country: settings.locationCountry,
    phone: settings.phone,
    whatsappUrl: settings.whatsappUrl,
    timezone: settings.timezone,
    currencySymbol: settings.currencySymbol,
    address: settings.addressVisible ? settings.address : null,
    biography: settings.biography,
    portraitMediaId: settings.portraitMediaId,
    hoursStart: settings.operatingHoursStart,
    hoursEnd: settings.operatingHoursEnd,
    workingDays: days,
    requestsOpen: bookingConfigured(settings),
    depositsEnabled: settings.depositsEnabled,
    paymentsReady: demo || (cng.configured && (cng.env === "sandbox" || cng.canChargeLive)),
    cngConfigured: cng.configured,
    cngLive: cng.canChargeLive,
    emailReady: notices.resend,
    smsReady: notices.twilio,
    copy,
  };
}

export type PublicSiteConfig = Awaited<ReturnType<typeof publicSiteConfig>>;
