-- CreateEnum
CREATE TYPE "Category" AS ENUM ('LOCS', 'BRAIDS', 'SEW_INS', 'PONYTAILS');

-- CreateEnum
CREATE TYPE "PricingType" AS ENUM ('FIXED', 'STARTING_FROM', 'RANGE', 'QUOTE_REQUIRED');

-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "MediaVisibility" AS ENUM ('PUBLIC', 'PRIVATE_INSPIRATION');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('REQUESTED', 'AWAITING_CLIENT_RESPONSE', 'AWAITING_DEPOSIT', 'CONFIRMED', 'COMPLETED', 'DECLINED', 'EXPIRED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('NONE', 'PENDING', 'PAID', 'FAILED', 'EXCEPTION', 'OFFLINE_RECORDED', 'WAIVED');

-- CreateEnum
CREATE TYPE "BookingPath" AS ENUM ('DISCOVERY', 'DIRECT', 'OWNER');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'PROPOSED', 'ACCEPTED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "CalendarSlotKind" AS ENUM ('HOLD', 'CONFIRMED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "PaymentAttemptStatus" AS ENUM ('CREATED', 'REDIRECTED', 'PENDING', 'VERIFIED', 'FAILED', 'EXCEPTION', 'CANCELLED_REDIRECT');

-- CreateEnum
CREATE TYPE "CreditEntryType" AS ENUM ('ORIGINAL_PAYMENT', 'CREDIT_ISSUED', 'CREDIT_ALLOCATED', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS', 'PUSH', 'IN_APP');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DepositType" AS ENUM ('FIXED', 'PERCENTAGE');

-- CreateTable
CREATE TABLE "Owner" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Owner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "name" TEXT NOT NULL DEFAULT 'Crowned by Chrissy',
    "locationCity" TEXT NOT NULL DEFAULT 'Freeport',
    "locationRegion" TEXT NOT NULL DEFAULT 'Grand Bahama',
    "locationCountry" TEXT NOT NULL DEFAULT 'The Bahamas',
    "phone" TEXT NOT NULL DEFAULT '+12426462700',
    "whatsappUrl" TEXT NOT NULL DEFAULT 'https://wa.me/12426462700',
    "timezone" TEXT NOT NULL DEFAULT 'America/Nassau',
    "currencyCode" TEXT NOT NULL DEFAULT 'BSD',
    "currencySymbol" TEXT NOT NULL DEFAULT 'B$',
    "address" TEXT,
    "addressVisible" BOOLEAN NOT NULL DEFAULT false,
    "biography" TEXT,
    "portraitMediaId" TEXT,
    "operatingHoursStart" TEXT NOT NULL DEFAULT '08:00',
    "operatingHoursEnd" TEXT NOT NULL DEFAULT '20:00',
    "workingDays" JSONB NOT NULL DEFAULT '[]',
    "closures" JSONB NOT NULL DEFAULT '[]',
    "depositsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "depositType" "DepositType" NOT NULL DEFAULT 'FIXED',
    "depositAmountMinor" INTEGER,
    "depositPercentBps" INTEGER,
    "defaultHoldMinutes" INTEGER NOT NULL DEFAULT 1440,
    "defaultPaymentDeadlineHours" INTEGER NOT NULL DEFAULT 24,
    "fullPaymentOptional" BOOLEAN NOT NULL DEFAULT false,
    "slotIntervalMinutes" INTEGER NOT NULL DEFAULT 30,
    "requestsOpen" BOOLEAN NOT NULL DEFAULT false,
    "publicCopy" JSONB NOT NULL DEFAULT '{}',
    "notificationPrefs" JSONB NOT NULL DEFAULT '{}',
    "cngMerchantReady" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "pricingType" "PricingType" NOT NULL,
    "priceMinMinor" INTEGER,
    "priceMaxMinor" INTEGER,
    "priceMaxOpenEnded" BOOLEAN NOT NULL DEFAULT false,
    "displayNote" TEXT,
    "durationMinutes" INTEGER,
    "bufferMinutes" INTEGER NOT NULL DEFAULT 0,
    "preparationInstructions" TEXT,
    "featuredImageId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceOptionGroup" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ServiceOptionGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceOption" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "note" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ServiceOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "kind" "MediaKind" NOT NULL DEFAULT 'IMAGE',
    "visibility" "MediaVisibility" NOT NULL DEFAULT 'PUBLIC',
    "slug" TEXT NOT NULL,
    "originalPath" TEXT NOT NULL,
    "derivedBase" TEXT,
    "posterPath" TEXT,
    "caption" TEXT,
    "alt" TEXT NOT NULL,
    "captionsVtt" TEXT,
    "category" "Category",
    "serviceId" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "focalX" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "focalY" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "width" INTEGER,
    "height" INTEGER,
    "durationSec" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "privateNotes" TEXT NOT NULL DEFAULT '',
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "publicToken" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'REQUESTED',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'NONE',
    "path" "BookingPath" NOT NULL,
    "serviceId" TEXT NOT NULL,
    "selectedOptions" JSONB NOT NULL DEFAULT '{}',
    "requestedStart" TIMESTAMP(3) NOT NULL,
    "alternativeStart" TIMESTAMP(3),
    "notes" TEXT,
    "inspirationMediaId" TEXT,
    "lookMediaId" TEXT,
    "policyAcknowledged" BOOLEAN NOT NULL DEFAULT false,
    "notificationPreference" TEXT NOT NULL DEFAULT 'email',
    "approvedStart" TIMESTAMP(3),
    "durationMinutes" INTEGER,
    "bufferMinutes" INTEGER,
    "agreedPriceMinor" INTEGER,
    "depositMinor" INTEGER,
    "balanceMinor" INTEGER,
    "paymentDeadlineAt" TIMESTAMP(3),
    "holdExpiresAt" TIMESTAMP(3),
    "customerNote" TEXT,
    "ownerPrivateNote" TEXT,
    "withoutDepositApproval" BOOLEAN NOT NULL DEFAULT false,
    "cancellationReason" TEXT,
    "ownerCancellationFlag" BOOLEAN NOT NULL DEFAULT false,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'PROPOSED',
    "serviceSnapshot" JSONB NOT NULL,
    "priceMinor" INTEGER,
    "depositMinor" INTEGER,
    "startAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "bufferMinutes" INTEGER NOT NULL,
    "customerNote" TEXT,
    "requiresAcceptance" BOOLEAN NOT NULL DEFAULT false,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarSlot" (
    "id" TEXT NOT NULL,
    "kind" "CalendarSlotKind" NOT NULL,
    "appointmentId" TEXT,
    "title" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CalendarSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAttempt" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "quoteId" TEXT,
    "orderNumber" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "payFull" BOOLEAN NOT NULL DEFAULT false,
    "status" "PaymentAttemptStatus" NOT NULL DEFAULT 'CREATED',
    "passphrase" TEXT NOT NULL,
    "redirectUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerifiedPayment" (
    "id" TEXT NOT NULL,
    "cngTransactionId" TEXT NOT NULL,
    "cngPaymentId" TEXT,
    "paymentAttemptId" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "grossAmountMinor" INTEGER NOT NULL,
    "netAmountMinor" INTEGER,
    "feeMinor" INTEGER,
    "provider" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "exceptionReason" TEXT,
    "rawPayload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerifiedPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditLedger" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "type" "CreditEntryType" NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "sourcePaymentId" TEXT,
    "allocationKey" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "CreditLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationMessage" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "recipient" TEXT NOT NULL,
    "appointmentId" TEXT,
    "templateKey" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'QUEUED',
    "provider" TEXT,
    "providerMessageId" TEXT,
    "error" TEXT,
    "scheduledFor" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "idempotencyKey" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "appointmentId" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitHit" (
    "key" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RateLimitHit_pkey" PRIMARY KEY ("key","windowStart")
);

-- CreateTable
CREATE TABLE "DemoGatewayPayment" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "specialId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemoGatewayPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Owner_email_key" ON "Owner"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Service_slug_key" ON "Service"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Media_slug_key" ON "Media"("slug");

-- CreateIndex
CREATE INDEX "Client_phone_idx" ON "Client"("phone");

-- CreateIndex
CREATE INDEX "Client_email_idx" ON "Client"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_publicToken_key" ON "Appointment"("publicToken");

-- CreateIndex
CREATE INDEX "Appointment_status_holdExpiresAt_idx" ON "Appointment"("status", "holdExpiresAt");

-- CreateIndex
CREATE INDEX "Appointment_status_approvedStart_idx" ON "Appointment"("status", "approvedStart");

-- CreateIndex
CREATE INDEX "Appointment_clientId_idx" ON "Appointment"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_appointmentId_version_key" ON "Quote"("appointmentId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarSlot_appointmentId_key" ON "CalendarSlot"("appointmentId");

-- CreateIndex
CREATE INDEX "CalendarSlot_startAt_endAt_idx" ON "CalendarSlot"("startAt", "endAt");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAttempt_orderNumber_key" ON "PaymentAttempt"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "VerifiedPayment_cngTransactionId_key" ON "VerifiedPayment"("cngTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "VerifiedPayment_paymentAttemptId_key" ON "VerifiedPayment"("paymentAttemptId");

-- CreateIndex
CREATE UNIQUE INDEX "CreditLedger_allocationKey_key" ON "CreditLedger"("allocationKey");

-- CreateIndex
CREATE INDEX "CreditLedger_clientId_idx" ON "CreditLedger"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationMessage_idempotencyKey_key" ON "NotificationMessage"("idempotencyKey");

-- CreateIndex
CREATE INDEX "NotificationMessage_status_scheduledFor_idx" ON "NotificationMessage"("status", "scheduledFor");

-- CreateIndex
CREATE INDEX "NotificationMessage_appointmentId_eventType_idx" ON "NotificationMessage"("appointmentId", "eventType");

-- CreateIndex
CREATE INDEX "AuditEvent_appointmentId_idx" ON "AuditEvent"("appointmentId");

-- CreateIndex
CREATE INDEX "AuditEvent_createdAt_idx" ON "AuditEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DemoGatewayPayment_orderNumber_key" ON "DemoGatewayPayment"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- AddForeignKey
ALTER TABLE "ServiceOptionGroup" ADD CONSTRAINT "ServiceOptionGroup_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceOption" ADD CONSTRAINT "ServiceOption_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ServiceOptionGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_inspirationMediaId_fkey" FOREIGN KEY ("inspirationMediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarSlot" ADD CONSTRAINT "CalendarSlot_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerifiedPayment" ADD CONSTRAINT "VerifiedPayment_paymentAttemptId_fkey" FOREIGN KEY ("paymentAttemptId") REFERENCES "PaymentAttempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerifiedPayment" ADD CONSTRAINT "VerifiedPayment_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditLedger" ADD CONSTRAINT "CreditLedger_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditLedger" ADD CONSTRAINT "CreditLedger_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationMessage" ADD CONSTRAINT "NotificationMessage_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
