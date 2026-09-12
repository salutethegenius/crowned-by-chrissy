export const CURRENCY_SYMBOL = "B$";

export function formatMoney(minor: number | null | undefined, opts?: { from?: boolean }) {
  if (minor == null) return "Quote required";
  const dollars = (minor / 100).toFixed(2).replace(/\.00$/, "");
  const value = `${CURRENCY_SYMBOL}${dollars}`;
  return opts?.from ? `From ${value}` : value;
}

export function formatMoneyRange(
  min: number | null | undefined,
  max: number | null | undefined,
  openEnded = false,
) {
  if (min == null && max == null) return "Quote required";
  if (min != null && max == null && openEnded) return `${formatMoney(min)}+`;
  if (min != null && max != null && openEnded) {
    return `${formatMoney(min)} to ${formatMoney(max)}+`;
  }
  if (min != null && max != null && min !== max) {
    return `${formatMoney(min)} to ${formatMoney(max)}`;
  }
  return formatMoney(min ?? max);
}

export function dollarsToMinor(amount: number) {
  return Math.round(amount * 100);
}

export function minorToCngAmount(minor: number) {
  return (minor / 100).toFixed(2);
}

export function parseCngAmountToMinor(amount: string | number) {
  const n = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}
