import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Cormorant_Garamond, Outfit } from "next/font/google";
import { DemoBanner } from "@/components/DemoBanner";
import { OfflineBanner } from "@/components/OfflineBanner";
import { SiteJsonLd } from "@/components/SiteJsonLd";
import { DEVELOPER, SITE_DESCRIPTION, SITE_KEYWORDS, SITE_NAME, publicSiteUrl } from "@/lib/site";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const siteUrl = publicSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: SITE_KEYWORDS,
  authors: [{ name: SITE_NAME, url: siteUrl }, { name: DEVELOPER.name, url: DEVELOPER.url }],
  creator: DEVELOPER.label,
  publisher: SITE_NAME,
  category: "beauty",
  openGraph: {
    type: "website",
    locale: "en_BS",
    url: siteUrl,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  formatDetection: {
    telephone: true,
    email: false,
    address: false,
  },
};

export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  themeColor: "#151217",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${cormorant.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-cream text-body">
        <SiteJsonLd />
        <OfflineBanner />
        <DemoBanner />
        {children}
      </body>
    </html>
  );
}
