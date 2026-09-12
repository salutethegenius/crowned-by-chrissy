import "server-only";

import { expireHolds } from "./availability";
import { processOutbox } from "./notifications";
import { reconcilePendingPayments } from "./payments/cng";
import { prisma } from "./db";
import { enqueueNotification } from "./notifications";
import { formatBusiness } from "./time";
import { bookingUrlFromToken } from "./urls";

function bookingUrl(token: string) {
  return bookingUrlFromToken(token);
}

export async function runScheduledJobs() {
  const expiredIds = await expireHolds();
  if (expiredIds.length) {
    const rows = await prisma.appointment.findMany({
      where: { id: { in: expiredIds } },
      include: { client: true, service: true },
    });
    for (const appt of rows) {
      await enqueueNotification(prisma, {
        eventType: "hold_expired",
        channel: "IN_APP",
        recipient: appt.client.email || appt.client.phone,
        appointmentId: appt.id,
        templateKey: "hold_expired",
        payload: {
          clientName: appt.client.name,
          serviceName: appt.service.name,
          bookingUrl: bookingUrl(appt.publicToken),
          startAt: appt.approvedStart?.toISOString(),
          when: appt.approvedStart ? formatBusiness(appt.approvedStart) : "",
        },
        idempotencyKey: `hold_expired:${appt.id}`,
      });
      if (appt.client.email) {
        await enqueueNotification(prisma, {
          eventType: "hold_expired",
          channel: "EMAIL",
          recipient: appt.client.email,
          appointmentId: appt.id,
          templateKey: "hold_expired",
          payload: {
            clientName: appt.client.name,
            serviceName: appt.service.name,
            bookingUrl: bookingUrl(appt.publicToken),
          },
          idempotencyKey: `hold_expired:${appt.id}:email`,
        });
      }
    }
  }
  await reconcilePendingPayments();
  await processOutbox();
}

let started = false;
export function startJobRunner() {
  if (started) return;
  started = true;
  const ms = Number(process.env.JOBS_INTERVAL_MS || 60000);
  setInterval(() => {
    runScheduledJobs().catch((error) => {
      console.error("[jobs]", error);
    });
  }, ms);
  runScheduledJobs().catch((error) => console.error("[jobs]", error));
}
