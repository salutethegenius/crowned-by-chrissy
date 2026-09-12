import { appUrl } from "./env";

export function bookingUrlFromToken(token: string) {
  return `${appUrl()}/appointments/${token}`;
}
