import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { publicServices } from "@/lib/queries";
import { priceLabel } from "@/lib/pricing";
import { Button } from "@/components/Button";

export const metadata = { title: "Services & pricing" };

const ORDER = ["LOCS", "BRAIDS", "SEW_INS", "PONYTAILS"] as const;
const LABELS = { LOCS: "Locs", BRAIDS: "Braids", SEW_INS: "Sew-ins", PONYTAILS: "Ponytails" };

export default async function ServicesPage() {
  const services = await publicServices();
  return (
    <div className="flex min-h-full flex-col bg-tan">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-4 py-16">
        <h1 className="font-serif text-4xl text-ink">Services & pricing</h1>
        <p className="mt-4 text-muted">
          Prices may vary depending on length and style. Hair is not included for braiding services.
        </p>
        {ORDER.map((cat) => (
          <section key={cat} className="mt-12">
            <h2 className="font-serif text-3xl text-ink">{LABELS[cat]}</h2>
            <ul className="mt-4 divide-y divide-ink/10 rounded-3xl bg-cream">
              {services
                .filter((s) => s.category === cat)
                .map((s) => (
                  <li key={s.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-ink">{s.name}</p>
                      <p className="text-muted">{s.description}</p>
                      {s.displayNote ? <p className="text-muted">{s.displayNote}</p> : null}
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-plum">{priceLabel(s)}</p>
                      <Button href={`/book?path=direct&service=${s.slug}`} variant="lilac" className="min-h-11 px-4">
                        Request
                      </Button>
                    </div>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </main>
      <SiteFooter />
    </div>
  );
}
