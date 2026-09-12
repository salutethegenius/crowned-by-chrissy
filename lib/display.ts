import { formatBusiness as formatTz } from "@/lib/time";
import { formatMoney as money } from "@/lib/money";

export function formatBusiness(date: Date) {
  return formatTz(date);
}

export function formatMoney(minor: number | null | undefined) {
  return money(minor);
}
