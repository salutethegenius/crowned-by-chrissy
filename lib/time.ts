import { addMinutes, format, parse } from "date-fns";
import { fromZonedTime, toZonedTime, formatInTimeZone } from "date-fns-tz";

export const BUSINESS_TZ = "America/Nassau";

export function nassauNow() {
  return toZonedTime(new Date(), BUSINESS_TZ);
}

export function zonedDateTime(date: string, time: string, tz = BUSINESS_TZ) {
  const local = parse(`${date} ${time}`, "yyyy-MM-dd HH:mm", new Date());
  return fromZonedTime(local, tz);
}

export function formatBusiness(date: Date, pattern = "EEEE, d MMMM yyyy 'at' h:mm a") {
  return formatInTimeZone(date, BUSINESS_TZ, pattern);
}

export function formatBusinessDate(date: Date) {
  return formatInTimeZone(date, BUSINESS_TZ, "EEEE, d MMMM yyyy");
}

export function formatBusinessTime(date: Date) {
  return formatInTimeZone(date, BUSINESS_TZ, "h:mm a");
}

export function businessYmd(date: Date) {
  return formatInTimeZone(date, BUSINESS_TZ, "yyyy-MM-dd");
}

export function businessHm(date: Date) {
  return formatInTimeZone(date, BUSINESS_TZ, "HH:mm");
}

export function weekdayInBusinessTz(date: Date) {
  return Number(formatInTimeZone(date, BUSINESS_TZ, "i"));
}

export function addMinutesUtc(date: Date, minutes: number) {
  return addMinutes(date, minutes);
}

export function hmToMinutes(hm: string) {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToHm(total: number) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function formatClock(hm: string) {
  const dummy = parse(hm, "HH:mm", new Date());
  return format(dummy, "h:mm a");
}

export const WEEKDAY_LABELS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 7, label: "Sunday" },
] as const;
