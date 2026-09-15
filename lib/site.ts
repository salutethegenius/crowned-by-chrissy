export const SITE_NAME = "Crowned by Chrissy";
export const SITE_TAGLINE = "Your next crown starts here.";
export const SITE_DESCRIPTION =
  "Locs, braids, sew-ins, and ponytails in Freeport, Grand Bahama. Explore Chrissy’s work and request your appointment.";
export const SITE_KEYWORDS = [
  "Crowned by Chrissy",
  "Freeport hair salon",
  "Grand Bahama braids",
  "locs Freeport",
  "knotless braids Bahamas",
  "sew-ins Freeport",
  "ponytails Grand Bahama",
  "hairstylist Freeport",
  "appointment booking Bahamas",
];

export const SITE_LOCATION = {
  city: "Freeport",
  region: "Grand Bahama",
  country: "The Bahamas",
  countryCode: "BS",
  phone: "+12426462700",
};

export const DEVELOPER = {
  name: "KemisDigital",
  url: "https://kemisdigital.com",
  label: "Developed by KemisDigital.com",
};

export const PUBLIC_ROUTES = [
  { path: "/", changeFrequency: "weekly" as const, priority: 1 },
  { path: "/styles", changeFrequency: "weekly" as const, priority: 0.9 },
  { path: "/services", changeFrequency: "weekly" as const, priority: 0.9 },
  { path: "/meet", changeFrequency: "monthly" as const, priority: 0.8 },
  { path: "/book", changeFrequency: "weekly" as const, priority: 0.9 },
  { path: "/policies", changeFrequency: "yearly" as const, priority: 0.4 },
] as const;

export function publicSiteUrl() {
  const raw =
    process.env.APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");
  return raw.replace(/\/$/, "");
}
