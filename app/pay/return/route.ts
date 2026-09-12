import { redirect } from "next/navigation";
import { verifyAndApplyPayment } from "@/lib/payments/cng";
import { prisma } from "@/lib/db";
import { enqueueNotification } from "@/lib/notifications";
import { bookingUrlFromToken } from "@/lib/urls";
import { scheduleReminder } from "@/lib/booking";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const order = url.searchParams.get("order") || url.searchParams.get("ORDER_NUMBER");
  if (!order) redirect("/");
  const result = await verifyAndApplyPayment(order);
  const attempt = await prisma.paymentAttempt.findUnique({
    where: { orderNumber: order },
    include: { appointment: { include: { client: true, service: true } } },
  });
  const token = attempt?.appointment.publicToken;
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
  }
  redirect(token ? `/appointments/${token}` : "/");
}
