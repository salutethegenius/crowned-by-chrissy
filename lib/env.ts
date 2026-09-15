import "server-only";

import { publicSiteUrl } from "./site";

function bool(value: string | undefined, fallback = false) {
  if (value == null || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

export function isDemoMode() {
  return bool(process.env.DEMO_MODE, false);
}

export function appUrl() {
  return publicSiteUrl();
}

export function sessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET must be set to a long random value.");
  }
  return secret;
}

export function cronSecret() {
  return process.env.CRON_SECRET || "";
}

export function cngConfig() {
  const authId = process.env.CNG_AUTH_ID?.trim() || "";
  const apiKey = process.env.CNG_API_KEY?.trim() || "";
  const env = process.env.CNG_ENV === "production" ? "production" : "sandbox";
  const liveEnabled = bool(process.env.CNG_LIVE_ENABLED, false);
  const currencyConfirmed = bool(process.env.CNG_CURRENCY_CONFIRMED, false);
  const configured = Boolean(authId && apiKey);
  const canChargeLive = configured && liveEnabled && env === "production";
  return {
    authId,
    apiKey,
    env: env as "sandbox" | "production",
    liveEnabled,
    currencyConfirmed,
    configured,
    canChargeLive,
    paymentOptions: process.env.CNG_PAYMENT_OPTIONS?.trim() || "",
    paymentMethod: process.env.CNG_PAYMENT_METHOD?.trim() || "",
    authUrl:
      env === "production"
        ? "https://paylanes.sprocket.solutions/merchant/web-payment/auth"
        : "https://paylanes-qa.sprocket.solutions/merchant/web-payment/auth",
    infoUrl:
      env === "production"
        ? "https://paylanes.sprocket.solutions/merchant/web-payment/transaction-info"
        : "https://paylanes-qa.sprocket.solutions/merchant/web-payment/transaction-info",
  };
}

export function notificationProviders() {
  const resend = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
  const twilio = Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM_NUMBER,
  );
  const push = Boolean(
    process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT,
  );
  return { resend, twilio, push };
}

export const CNG_MIN_AMOUNT_MINOR = 101;
