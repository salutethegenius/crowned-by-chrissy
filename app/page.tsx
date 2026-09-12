import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Photo } from "@/components/Photo";
import { Button } from "@/components/Button";
import { featuredLooks, publicGallery, publicServices, salonPhotos } from "@/lib/queries";
import { publicSiteConfig } from "@/lib/settings";
import { priceLabel } from "@/lib/pricing";
import { displayPhone } from "@/lib/phone";
import { WEEKDAY_LABELS } from "@/lib/time";
import { FavouriteButton } from "@/components/FavouriteButton";

const CATEGORIES = [
  { key: "LOCS" as const, label: "Locs", slug: "starter-locs", href: "/book?path=discovery&category=LOCS" },
  { key: "BRAIDS" as const, label: "Braids", slug: "knotless-braids-long-back", href: "/book?path=discovery&category=BRAIDS" },
  { key: "SEW_INS" as const, label: "Sew-ins", slug: "salon-wall-signs", href: "/book?path=discovery&category=SEW_INS" },
  { key: "PONYTAILS" as const, label: "Ponytails", slug: "locs-low-ponytail", href: "/book?path=discovery&category=PONYTAILS" },
];

export default async function HomePage() {
  const [site, looks, services, salon, gallery] = await Promise.all([
    publicSiteConfig(),
    featuredLooks(),
    publicServices(),
    salonPhotos(),
    publicGallery(),
  ]);
  const copy = site.copy;
  const days = site.workingDays.map((d) => WEEKDAY_LABELS.find((w) => w.value === d)?.label).filter(Boolean);

  return (
    <>
      <div className="relative min-h-[100svh] bg-ink text-cream">
        <Photo
          base="/media/derived/knotless-braids-long-back"
          alt="Long knotless braids photographed in the salon"
          className="absolute inset-0 h-full w-full opacity-50"
          priority
          widthHint={1600}
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/80 via-ink/55 to-ink" />
        <div className="relative flex min-h-[100svh] flex-col">
          <SiteHeader dark />
          <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-end px-4 pb-16 pt-20 sm:px-6 sm:pb-24">
            <p className="text-sm tracking-[0.25em] text-gold uppercase">Freeport, Grand Bahama</p>
            <h1 className="mt-4 max-w-3xl font-serif text-5xl leading-tight sm:text-7xl">
              {copy.heroHeadline || "Your next crown starts here."}
            </h1>
            <p className="mt-6 max-w-xl text-lg text-cream/85">
              {copy.heroSupport ||
                "Explore Chrissy’s work, find your look, and request your appointment in Freeport."}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button href="/book?path=discovery" variant="lilac">
                Find My Look
              </Button>
              <Button href="/book?path=direct" variant="secondary">
                I Know What I Want
              </Button>
            </div>
          </div>
        </div>
      </div>

      <section className="bg-cream px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-serif text-4xl text-ink">Choose your category</h2>
          <p className="mt-3 max-w-2xl text-muted">Four ways to start. Pick the family of styles you’re dreaming about.</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORIES.map((cat) => (
              <Link key={cat.key} href={cat.href} className="group relative block min-h-64 overflow-hidden rounded-3xl">
                <Photo
                  base={`/media/derived/${cat.slug}`}
                  alt={cat.label}
                  className="transition duration-500 group-hover:scale-105"
                />
                <span className="absolute inset-0 bg-ink/35" />
                <span className="absolute bottom-5 left-5 font-serif text-3xl text-cream">{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-tan px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-serif text-4xl text-ink">Featured looks</h2>
            <Link href="/styles" className="text-plum underline-offset-4 hover:underline">
              All styles
            </Link>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {looks.map((look) => (
              <article key={look.id} className="overflow-hidden rounded-3xl bg-cream shadow-sm">
                <div className="relative aspect-[3/4]">
                  <Photo base={look.derivedBase} alt={look.alt} focalX={look.focalX} focalY={look.focalY} />
                  <FavouriteButton id={look.id} />
                </div>
                <div className="space-y-2 p-5">
                  <p className="text-sm uppercase tracking-widest text-plum">{look.category?.toLowerCase()}</p>
                  <h3 className="font-serif text-2xl text-ink">{look.caption}</h3>
                  <p className="text-muted">{look.service ? priceLabel(look.service) : "Ask Chrissy"}</p>
                  <Button href={`/book?path=discovery&look=${look.slug}`} variant="lilac" className="mt-2 w-full">
                    Request This Look
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-cream px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-serif text-4xl text-ink">How appointments work</h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { n: "01", t: "Choose your look and request a time.", d: "Browse styles or jump straight to a service. You send a request — not an instant booking." },
              { n: "02", t: "Chrissy reviews your request.", d: "She confirms the style, timing, and price. If something needs to change, you’ll see it clearly first." },
              { n: "03", t: "Pay your deposit after approval.", d: "A deposit holds your spot. It is credited toward your service, not added on top." },
            ].map((step) => (
              <li key={step.n} className="rounded-3xl border border-ink/10 p-6">
                <p className="text-gold">{step.n}</p>
                <h3 className="mt-3 font-serif text-2xl text-ink">{step.t}</h3>
                <p className="mt-3 text-muted">{step.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-tan px-4 py-20 sm:px-6" id="services">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-end justify-between">
            <h2 className="font-serif text-4xl text-ink">Services</h2>
            <Link href="/services" className="text-plum underline-offset-4 hover:underline">
              Full list
            </Link>
          </div>
          <div className="mt-8 divide-y divide-ink/10 rounded-3xl bg-cream">
            {services.slice(0, 8).map((service) => (
              <details key={service.id} className="group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                  <span className="font-medium text-ink">{service.name}</span>
                  <span className="text-plum">{priceLabel(service)}</span>
                </summary>
                <p className="mt-3 max-w-2xl text-muted">{service.description}</p>
                {service.displayNote ? <p className="mt-2 text-sm text-muted">{service.displayNote}</p> : null}
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-cream px-4 py-20 sm:px-6" id="meet">
        <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
          <div className="overflow-hidden rounded-3xl">
            <Photo
              base={salon[0]?.derivedBase || "/media/derived/salon-hexagon-wall"}
              alt={salon[0]?.alt || "Crowned by Chrissy studio wall"}
            />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-plum">Meet Chrissy</p>
            <h2 className="mt-3 font-serif text-4xl text-ink">A chair in Freeport, made for your next look.</h2>
            <p className="mt-5 text-lg text-muted">
              {copy.meet ||
                "Chrissy styles locs, braids, sew-ins, and ponytails in Freeport, Grand Bahama. Request a time that works for you — she reviews every appointment personally."}
            </p>
            <Button href="/meet" variant="ghost" className="mt-6">
              More about the salon
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-tan px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-serif text-4xl text-ink">Salon and preparation</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="overflow-hidden rounded-3xl">
              <Photo
                base="/media/derived/salon-wall-signs"
                alt="Purple hexagon signs reading Crowned By Chrissy"
              />
            </div>
            <div className="rounded-3xl bg-cream p-6">
              <p className="text-lg text-body">
                {copy.prep ||
                  "Please arrive with hair clean and ready unless a wash service is included. Hair is not included for braiding services."}
              </p>
              <ul className="mt-6 space-y-2 text-muted">
                <li>Hours: {site.hoursStart} – {site.hoursEnd} (America/Nassau)</li>
                <li>
                  Working days:{" "}
                  {days.length ? days.join(", ") : "Chrissy is still confirming working days. You can browse and reach out meanwhile."}
                </li>
                {!site.requestsOpen ? (
                  <li>Online requests are paused until the schedule is fully configured.</li>
                ) : null}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-cream px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-serif text-4xl text-ink">Questions, answered</h2>
          {[
            ["Is my time confirmed when I send a request?", "No. Chrissy reviews every request. You’ll hear back with an approval, a suggested change, or a decline."],
            ["When do I pay a deposit?", "After Chrissy approves. The deposit holds your spot and is credited toward your service."],
            ["Can I reschedule?", "Yes. Ask from your booking page. A new date still needs Chrissy’s approval and an open time."],
            ["Is hair included?", "Hair is not included for braiding services unless Chrissy says otherwise on your quote."],
            ["How should I arrive?", "Come with hair clean and ready unless your service includes a wash."],
            ["How do I reach Chrissy?", `Call ${displayPhone(site.phone)} or use WhatsApp. Online booking is the primary way to request a time.`],
          ].map(([q, a]) => (
            <details key={q} className="border-b border-ink/10 py-4">
              <summary className="cursor-pointer font-medium text-ink">{q}</summary>
              <p className="mt-2 text-muted">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="bg-ink px-4 py-20 text-cream sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-serif text-5xl">Ready for your next look?</h2>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button href="/book" variant="lilac">
              Request an appointment
            </Button>
            <a href={site.whatsappUrl} className="text-cream/80 underline-offset-4 hover:underline">
              WhatsApp help
            </a>
          </div>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
