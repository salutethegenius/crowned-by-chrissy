import "server-only";

import { prisma } from "./db";

const WINDOW_MS = 10 * 60 * 1000;

export async function rateLimit(key: string, max: number) {
  const windowStart = new Date(Math.floor(Date.now() / WINDOW_MS) * WINDOW_MS);
  const row = await prisma.rateLimitHit.upsert({
    where: { key_windowStart: { key, windowStart } },
    create: { key, windowStart, count: 1 },
    update: { count: { increment: 1 } },
  });
  if (row.count > max) {
    return { ok: false as const, retryAt: new Date(windowStart.getTime() + WINDOW_MS) };
  }
  return { ok: true as const };
}
