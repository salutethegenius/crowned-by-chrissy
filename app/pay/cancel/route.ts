import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyAndApplyPayment } from "@/lib/payments/cng";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const order = url.searchParams.get("order") || url.searchParams.get("ORDER_NUMBER");
  if (order) {
    await prisma.paymentAttempt.updateMany({
      where: { orderNumber: order, status: { in: ["CREATED", "REDIRECTED"] } },
      data: { status: "CANCELLED_REDIRECT" },
    });
    await verifyAndApplyPayment(order);
    const attempt = await prisma.paymentAttempt.findUnique({
      where: { orderNumber: order },
      include: { appointment: true },
    });
    if (attempt) redirect(`/appointments/${attempt.appointment.publicToken}`);
  }
  redirect("/");
}
