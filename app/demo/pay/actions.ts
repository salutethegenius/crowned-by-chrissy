"use server";

import { redirect } from "next/navigation";
import { isDemoMode } from "@/lib/env";
import { prisma } from "@/lib/db";
import { simulateDemoPayment, verifyAndApplyPayment } from "@/lib/payments/cng";
import { enqueueNotification } from "@/lib/notifications";
import { bookingUrlFromToken } from "@/lib/urls";
import { scheduleReminder } from "@/lib/booking";

export async function simulateDemoPay(orderNumber: string) {
  if (!isDemoMode()) return { error: "Demo payments are disabled." };
  await simulateDemoPayment(orderNumber);
  const result = await verifyAndApplyPayment(orderNumber);
  const attempt = await prisma.paymentAttempt.findUnique({
    where: { orderNumber },
    include: { appointment: { include: { client: true, service: true } } },
  });
  if (result.ok && attempt) {
    await enqueueNotification(prisma, {
      eventType: "payment_confirmed",
      channel: "IN_APP",
      recipient: "client",
      appointmentId: attempt.appointmentId,
      templateKey: "payment_confirmed",
      payload: {
        clientName: attempt.appointment.client.name,
        serviceName: attempt.appointment.service.name,
        startAt: attempt.appointment.approvedStart?.toISOString(),
        bookingUrl: bookingUrlFromToken(attempt.appointment.publicToken),
      },
      idempotencyKey: `payment_confirmed:${attempt.appointmentId}`,
    });
    await scheduleReminder(attempt.appointmentId);
    redirect(`/appointments/${attempt.appointment.publicToken}`);
  }
  if (attempt) redirect(`/appointments/${attempt.appointment.publicToken}`);
  return { error: result.ok ? undefined : ("reason" in result ? result.reason : "Could not verify") };
}
