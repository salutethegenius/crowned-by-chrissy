import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Cormorant_Garamond, Outfit } from "next/font/google";
import { DemoBanner } from "@/components/DemoBanner";
import { OfflineBanner } from "@/components/OfflineBanner";
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

export const metadata: Metadata = {
  title: {
    default: "Crowned by Chrissy",
    template: "%s · Crowned by Chrissy",
  },
  description:
    "Locs, braids, sew-ins, and ponytails in Freeport, Grand Bahama. Explore Chrissy’s work and request your appointment.",
  applicationName: "Crowned by Chrissy",
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
        <OfflineBanner />
        <DemoBanner />
        {children}
      </body>
    </html>
  );
}
