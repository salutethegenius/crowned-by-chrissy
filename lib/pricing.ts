import type { PricingType, Service } from "@prisma/client";
import { formatMoney, formatMoneyRange } from "./money";

export type Priced = Pick<
  Service,
  "pricingType" | "priceMinMinor" | "priceMaxMinor" | "priceMaxOpenEnded"
>;

export function priceLabel(service: Priced) {
  switch (service.pricingType as PricingType) {
    case "FIXED":
      return service.priceMinMinor != null ? formatMoney(service.priceMinMinor) : "Quote required";
    case "STARTING_FROM":
      return service.priceMinMinor != null
        ? formatMoney(service.priceMinMinor, { from: true })
        : "Quote required";
    case "RANGE":
      return formatMoneyRange(
        service.priceMinMinor,
        service.priceMaxMinor,
        service.priceMaxOpenEnded,
      );
    case "QUOTE_REQUIRED":
    default:
      return "Quote required";
  }
}

export function isQuoteRequired(service: Priced) {
  return (
    service.pricingType === "QUOTE_REQUIRED" ||
    (service.pricingType !== "FIXED" && service.priceMinMinor == null)
  );
}

export function suggestedPriceMinor(service: Priced) {
  if (service.pricingType === "QUOTE_REQUIRED") return null;
  return service.priceMinMinor;
}

export function computeDepositMinor(params: {
  priceMinor: number;
  depositsEnabled: boolean;
  depositType: "FIXED" | "PERCENTAGE";
  depositAmountMinor: number | null;
  depositPercentBps: number | null;
  overrideMinor?: number | null;
}) {
  if (!params.depositsEnabled) return 0;
  let deposit =
    params.overrideMinor != null
      ? params.overrideMinor
      : params.depositType === "PERCENTAGE"
        ? Math.round((params.priceMinor * (params.depositPercentBps ?? 0)) / 10000)
        : (params.depositAmountMinor ?? 0);
  if (deposit > params.priceMinor) deposit = params.priceMinor;
  return deposit;
}
