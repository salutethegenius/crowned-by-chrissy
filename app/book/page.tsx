import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { publicGallery, publicServices } from "@/lib/queries";
import { publicSiteConfig } from "@/lib/settings";

export const metadata = {
  title: "Book",
  description:
    "Request a Crowned by Chrissy appointment in Freeport. Choose a look or service — Chrissy approves before any deposit.",
  alternates: { canonical: "/book" },
};

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ path?: string; category?: string; look?: string; service?: string }>;
}) {
  const params = await searchParams;
  const [services, gallery, site] = await Promise.all([publicServices(), publicGallery(), publicSiteConfig()]);
  return (
    <div className="flex min-h-full flex-col bg-cream">
      <SiteHeader />
      <BookingWizard
        services={JSON.parse(JSON.stringify(services))}
        gallery={JSON.parse(JSON.stringify(gallery))}
        requestsOpen={site.requestsOpen}
        whatsappUrl={site.whatsappUrl}
        initialPath={params.path === "direct" ? "direct" : "discovery"}
        initialCategory={params.category}
        initialLook={params.look}
        initialService={params.service}
      />
      <SiteFooter />
    </div>
  );
}
