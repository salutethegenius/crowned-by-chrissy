import { describe, expect, it, beforeAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { approveAppointment, submitAppointmentRequest, startPayment } from "@/lib/booking";
import { verifyAndApplyPayment, simulateDemoPayment } from "@/lib/payments/cng";
import { addMinutes } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { allocateCredit, clientCreditBalance } from "@/lib/credit";

const prisma = new PrismaClient();

function slot(days = 10, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return fromZonedTime(`${y}-${m}-${day} ${String(hour).padStart(2, "0")}:00:00`, "America/Nassau");
}

async function freeStart(hour = 10) {
  for (let d = 20; d < 90; d++) {
    const start = slot(d, hour);
    const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
    const clash = await prisma.calendarSlot.findFirst({
      where: { startAt: { lt: end }, endAt: { gt: start } },
    });
    if (!clash) return start;
  }
  throw new Error("no free test slot");
}

describe("booking risks", () => {
  let serviceId: string;

  beforeAll(async () => {
    process.env.DEMO_MODE = "true";
    const service = await prisma.service.findFirst({ where: { slug: "loc-styling" } });
    if (!service) throw new Error("seed first");
    serviceId = service.id;
    await prisma.businessSettings.update({
      where: { id: "singleton" },
      data: { requestsOpen: true, workingDays: [1, 2, 3, 4, 5, 6, 7], depositsEnabled: true },
    });
  });

  it("submits discovery and direct requests without auto-confirming", async () => {
    const start = slot(12, 9);
    const a = await submitAppointmentRequest({
      name: "Test A",
      phone: "2425550101",
      email: "a@example.invalid",
      serviceId,
      selectedOptions: {},
      requestedStart: start,
      policyAcknowledged: true,
      notificationPreference: "email",
      path: "DISCOVERY",
    });
    const b = await submitAppointmentRequest({
      name: "Test B",
      phone: "2425550102",
      email: "b@example.invalid",
      serviceId,
      selectedOptions: {},
      requestedStart: slot(12, 14),
      policyAcknowledged: true,
      notificationPreference: "link",
      path: "DIRECT",
    });
    const ra = await prisma.appointment.findUniqueOrThrow({ where: { id: a.id } });
    const rb = await prisma.appointment.findUniqueOrThrow({ where: { id: b.id } });
    expect(ra.status).toBe("REQUESTED");
    expect(rb.status).toBe("REQUESTED");
  });

  it("prevents overlapping approvals", async () => {
    const start = await freeStart(11);
    const first = await submitAppointmentRequest({
      name: "Overlap 1",
      phone: "2425550201",
      serviceId,
      selectedOptions: {},
      requestedStart: start,
      policyAcknowledged: true,
      notificationPreference: "link",
      path: "DIRECT",
    });
    const second = await submitAppointmentRequest({
      name: "Overlap 2",
      phone: "2425550202",
      serviceId,
      selectedOptions: {},
      requestedStart: start,
      policyAcknowledged: true,
      notificationPreference: "link",
      path: "DIRECT",
    });
    await approveAppointment({
      appointmentId: first.id,
      actor: "test",
      startAt: start,
      durationMinutes: 90,
      bufferMinutes: 15,
      priceMinor: 3000,
      depositMinor: 2000,
    });
    await expect(
      approveAppointment({
        appointmentId: second.id,
        actor: "test",
        startAt: start,
        durationMinutes: 90,
        bufferMinutes: 15,
        priceMinor: 3000,
        depositMinor: 2000,
      }),
    ).rejects.toThrow();
  });

  it("expires holds and releases the calendar", async () => {
    const start = await freeStart(10);
    const req = await submitAppointmentRequest({
      name: "Expire",
      phone: "2425550301",
      serviceId,
      selectedOptions: {},
      requestedStart: start,
      policyAcknowledged: true,
      notificationPreference: "link",
      path: "DIRECT",
    });
    await approveAppointment({
      appointmentId: req.id,
      actor: "test",
      startAt: start,
      durationMinutes: 60,
      bufferMinutes: 15,
      priceMinor: 3000,
      depositMinor: 2000,
    });
    await prisma.appointment.update({
      where: { id: req.id },
      data: { holdExpiresAt: addMinutes(new Date(), -1) },
    });
    const { expireHolds } = await import("@/lib/availability");
    await expireHolds();
    const row = await prisma.appointment.findUniqueOrThrow({ where: { id: req.id } });
    expect(row.status).toBe("EXPIRED");
    const slotRow = await prisma.calendarSlot.findUnique({ where: { appointmentId: req.id } });
    expect(slotRow).toBeNull();
  });

  it("ignores forged success URLs and does not double-credit", async () => {
    const start = await freeStart(13);
    const req = await submitAppointmentRequest({
      name: "Pay",
      phone: "2425550401",
      email: "pay@example.invalid",
      serviceId,
      selectedOptions: {},
      requestedStart: start,
      policyAcknowledged: true,
      notificationPreference: "email",
      path: "DIRECT",
    });
    await approveAppointment({
      appointmentId: req.id,
      actor: "test",
      startAt: start,
      durationMinutes: 60,
      bufferMinutes: 15,
      priceMinor: 4000,
      depositMinor: 2000,
    });
    const appt = await prisma.appointment.findUniqueOrThrow({ where: { id: req.id } });
    const forged = await verifyAndApplyPayment("forged-order");
    expect(forged.ok).toBe(false);
    const { redirectUrl: _, orderNumber } = await startPayment(appt.publicToken);
    void _;
    await simulateDemoPayment(orderNumber);
    const first = await verifyAndApplyPayment(orderNumber);
    const second = await verifyAndApplyPayment(orderNumber);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect("already" in second && second.already).toBe(true);
    const pays = await prisma.verifiedPayment.findMany({
      where: { appointmentId: req.id },
    });
    expect(pays).toHaveLength(1);
  });

  it("does not apply the same credit twice", async () => {
    const client = await prisma.client.create({
      data: { name: "Credit", phone: "+12425550999", isDemo: true },
    });
    await prisma.creditLedger.create({
      data: {
        clientId: client.id,
        type: "CREDIT_ISSUED",
        amountMinor: 2000,
        createdBy: "test",
      },
    });
    const one = await allocateCredit({ clientId: client.id, targetAppointmentId: "appt-a", amountMinor: 2000, actor: "test" });
    const two = await allocateCredit({ clientId: client.id, targetAppointmentId: "appt-a", amountMinor: 2000, actor: "test" });
    expect(one).toBe(2000);
    expect(two).toBe(0);
    expect(await clientCreditBalance(client.id)).toBe(0);
  });
});
