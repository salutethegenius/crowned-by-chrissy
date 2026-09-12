import Link from "next/link";
import { publicSiteConfig } from "@/lib/settings";
import { displayPhone } from "@/lib/phone";

export async function SiteFooter() {
  const site = await publicSiteConfig();
  return (
    <footer className="mt-auto bg-ink text-cream">
      <div className="gold-rule" />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3 sm:px-6">
        <div>
          <p className="font-serif text-2xl">Crowned by Chrissy</p>
          <p className="mt-2 text-cream/80">
            {site.city}, {site.region}
          </p>
          {site.address ? <p className="mt-1 text-cream/80">{site.address}</p> : null}
        </div>
        <div>
          <p className="text-sm uppercase tracking-widest text-gold">Visit</p>
          <a className="mt-2 block min-h-11 py-1" href={`tel:${site.phone}`}>
            {displayPhone(site.phone)}
          </a>
          <a className="block min-h-11 py-1 text-cream/80" href={site.whatsappUrl}>
            WhatsApp
          </a>
        </div>
        <div>
          <p className="text-sm uppercase tracking-widest text-gold">Policies</p>
          <Link className="mt-2 block min-h-11 py-1" href="/policies">
            Booking & deposits
          </Link>
          <Link className="block min-h-11 py-1" href="/owner/login">
            Owner login
          </Link>
        </div>
      </div>
    </footer>
  );
}
