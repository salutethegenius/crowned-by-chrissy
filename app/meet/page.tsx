import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Photo } from "@/components/Photo";
import { publicSiteConfig } from "@/lib/settings";
import { displayPhone } from "@/lib/phone";
import { Button } from "@/components/Button";

export const metadata = {
  title: "Meet Chrissy",
  description:
    "Meet Chrissy in Freeport, Grand Bahama. Locs, braids, sew-ins, and ponytails — request a time she reviews personally.",
  alternates: { canonical: "/meet" },
};

export default async function MeetPage() {
  const site = await publicSiteConfig();
  return (
    <div className="flex min-h-full flex-col bg-cream">
      <SiteHeader />
      <main className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 md:grid-cols-2">
        <div className="aspect-[3/4] overflow-hidden rounded-3xl bg-ink/5">
          <Photo
            base={site.portrait?.derivedBase || "/media/derived/salon-hexagon-wall"}
            alt={site.portrait?.alt || "Crowned By Chrissy studio wall"}
            focalX={site.portrait?.focalX ?? 0.5}
            focalY={site.portrait?.focalY ?? 0.5}
            priority
            widthHint={1200}
          />
        </div>
        <div>
          <h1 className="font-serif text-4xl text-ink">Meet Chrissy</h1>
          <p className="mt-6 text-lg text-muted">
            {site.biography ||
              site.copy.meet ||
              "Chrissy styles locs, braids, sew-ins, and ponytails in Freeport, Grand Bahama. Request a time that works for you — she reviews every appointment personally."}
          </p>
          <p className="mt-4 text-muted">
            {site.city}, {site.region}, {site.country}
            {site.address ? ` · ${site.address}` : ""}
          </p>
          <p className="mt-2">
            <a href={`tel:${site.phone}`}>{displayPhone(site.phone)}</a>
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button href="/book" variant="lilac">
              Request an appointment
            </Button>
            <Button href={site.whatsappUrl} variant="ghost">
              WhatsApp
            </Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
