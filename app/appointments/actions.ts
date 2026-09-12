"use server";

import { redirect } from "next/navigation";
import { acceptQuote, requestCancellation, requestReschedule, startPayment } from "@/lib/booking";
import { zonedDateTime } from "@/lib/time";
import { AppError } from "@/lib/errors";

export async function acceptQuoteAction(token: string) {
  try {
    await acceptQuote(token);
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    throw error;
  }
}

export async function payAction(token: string) {
  try {
    const { redirectUrl } = await startPayment(token);
    redirect(redirectUrl);
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    throw error;
  }
}

export async function cancelAction(token: string) {
  try {
    await requestCancellation(token);
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    throw error;
  }
}

export async function rescheduleAction(token: string, date: string, time: string) {
  try {
    await requestReschedule(token, zonedDateTime(date, time));
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    throw error;
  }
}
