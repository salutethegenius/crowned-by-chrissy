import { PrismaClient } from "@prisma/client";
import { addDays, setHours, setMinutes } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { nanoid } from "nanoid";

const prisma = new PrismaClient();
const TZ = "America/Nassau";

function nassau(daysAhead: number, hour: number, minute = 0) {
  const base = addDays(new Date(), daysAhead);
  const local = setMinutes(setHours(base, hour), minute);
  return fromZonedTime(local, TZ);
}

async function main() {
  if (!["1", "true", "yes"].includes((process.env.DEMO_MODE || "").toLowerCase())) {
    console.log("Refusing to seed demo data because DEMO_MODE is not true.");
    return;
  }

  const durations: Record<string, [number, number]> = {
    "starter-locs": [180, 15],
    "loc-wash-treatment-style": [120, 15],
    "loc-retwist": [90, 15],
    "loc-styling": [60, 15],
    "knotless-braids": [300, 20],
    "box-braids": [300, 20],
    "miracle-invisible-locs": [360, 20],
    "traditional-sew-in": [180, 20],
    "quick-weave": [120, 15],
    "closure-sew-in": [180, 20],
    "sleek-ponytail": [90, 15],
    "extended-ponytail": [120, 15],
  };
  for (const [slug, [duration, buffer]] of Object.entries(durations)) {
    await prisma.service.update({
      where: { slug },
      data: { durationMinutes: duration, bufferMinutes: buffer },
    });
  }

  await prisma.businessSettings.update({
    where: { id: "singleton" },
    data: {
      workingDays: [1, 2, 3, 4, 5, 6],
      requestsOpen: true,
      depositsEnabled: true,
      depositType: "FIXED",
      depositAmountMinor: 2000,
      defaultHoldMinutes: 120,
      defaultPaymentDeadlineHours: 2,
      biography: null,
    },
  });

  await prisma.appointment.deleteMany({ where: { isDemo: true } });
  await prisma.client.deleteMany({ where: { isDemo: true } });

  const knotless = await prisma.service.findUniqueOrThrow({ where: { slug: "knotless-braids" } });
  const retwist = await prisma.service.findUniqueOrThrow({ where: { slug: "loc-retwist" } });
  const look = await prisma.media.findUnique({ where: { slug: "knotless-braids-long-back" } });

  const requestedClient = await prisma.client.create({
    data: { name: "Demo Client (Request)", phone: "+12425550101", email: "demo-request@example.invalid", isDemo: true },
  });
  const holdClient = await prisma.client.create({
    data: { name: "Demo Client (Deposit due)", phone: "+12425550102", email: "demo-deposit@example.invalid", isDemo: true },
  });
  const confirmedClient = await prisma.client.create({
    data: { name: "Demo Client (Confirmed)", phone: "+12425550103", email: "demo-confirmed@example.invalid", isDemo: true },
  });

  await prisma.appointment.create({
    data: {
      publicToken: nanoid(32),
      clientId: requestedClient.id,
      serviceId: knotless.id,
      path: "DISCOVERY",
      status: "REQUESTED",
      requestedStart: nassau(3, 10),
      selectedOptions: { Size: "Medium", Length: "Mid-back" },
      notes: "DEMO sample request — not a real client.",
      lookMediaId: look?.id,
      policyAcknowledged: true,
      isDemo: true,
    },
  });

  const holdStart = nassau(1, 11);
  const holdAppt = await prisma.appointment.create({
    data: {
      publicToken: nanoid(32),
      clientId: holdClient.id,
      serviceId: knotless.id,
      path: "DIRECT",
      status: "AWAITING_DEPOSIT",
      paymentStatus: "PENDING",
      requestedStart: holdStart,
      approvedStart: holdStart,
      durationMinutes: 300,
      bufferMinutes: 20,
      agreedPriceMinor: 12000,
      depositMinor: 2000,
      balanceMinor: 10000,
      holdExpiresAt: addDays(new Date(), 0) && new Date(Date.now() + 90 * 60 * 1000),
      paymentDeadlineAt: new Date(Date.now() + 90 * 60 * 1000),
      selectedOptions: { Size: "Small", Length: "Waist" },
      notes: "DEMO hold awaiting deposit.",
      policyAcknowledged: true,
      isDemo: true,
    },
  });
  await prisma.calendarSlot.create({
    data: {
      kind: "HOLD",
      appointmentId: holdAppt.id,
      startAt: holdStart,
      endAt: new Date(holdStart.getTime() + 320 * 60 * 1000),
      title: "DEMO hold",
    },
  });
  await prisma.quote.create({
    data: {
      appointmentId: holdAppt.id,
      version: 1,
      status: "ACCEPTED",
      serviceSnapshot: { serviceName: knotless.name },
      priceMinor: 12000,
      depositMinor: 2000,
      startAt: holdStart,
      durationMinutes: 300,
      bufferMinutes: 20,
      acceptedAt: new Date(),
    },
  });

  const confStart = nassau(2, 13);
  const conf = await prisma.appointment.create({
    data: {
      publicToken: nanoid(32),
      clientId: confirmedClient.id,
      serviceId: retwist.id,
      path: "OWNER",
      status: "CONFIRMED",
      paymentStatus: "PAID",
      requestedStart: confStart,
      approvedStart: confStart,
      durationMinutes: 90,
      bufferMinutes: 15,
      agreedPriceMinor: 4000,
      depositMinor: 2000,
      balanceMinor: 2000,
      selectedOptions: {},
      notes: "DEMO confirmed appointment.",
      policyAcknowledged: true,
      isDemo: true,
    },
  });
  await prisma.calendarSlot.create({
    data: {
      kind: "CONFIRMED",
      appointmentId: conf.id,
      startAt: confStart,
      endAt: new Date(confStart.getTime() + 105 * 60 * 1000),
      title: "DEMO confirmed",
    },
  });

  console.log("Demo catalogue timing, working days, and labelled sample appointments are ready.");
  console.log("Demo owner login:", process.env.DEMO_OWNER_EMAIL);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
