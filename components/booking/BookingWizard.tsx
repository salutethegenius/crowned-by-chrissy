"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useOffline } from "next/offline";
import { Photo } from "@/components/Photo";
import { Button } from "@/components/Button";
import { FavouriteButton } from "@/components/FavouriteButton";
import { priceLabel } from "@/lib/pricing";
import { formatClock } from "@/lib/time";
import { getAvailabilityAction, submitRequestAction } from "@/app/book/actions";
import { CrownMark } from "./CrownMark";

type Service = {
  id: string;
  slug: string;
  name: string;
  category: "LOCS" | "BRAIDS" | "SEW_INS" | "PONYTAILS";
  description: string;
  pricingType: "FIXED" | "STARTING_FROM" | "RANGE" | "QUOTE_REQUIRED";
  priceMinMinor: number | null;
  priceMaxMinor: number | null;
  priceMaxOpenEnded: boolean;
  displayNote: string | null;
  durationMinutes: number | null;
  optionGroups: { id: string; name: string; required: boolean; options: { id: string; label: string }[] }[];
};

type Look = {
  id: string;
  slug: string;
  alt: string;
  caption: string | null;
  derivedBase: string | null;
  category: Service["category"] | null;
  service: Service | null;
  focalX: number;
  focalY: number;
};

const CATS: { key: Service["category"]; label: string; slug: string }[] = [
  { key: "LOCS", label: "Locs", slug: "starter-locs" },
  { key: "BRAIDS", label: "Braids", slug: "knotless-braids-long-back" },
  { key: "SEW_INS", label: "Sew-ins", slug: "salon-wall-signs" },
  { key: "PONYTAILS", label: "Ponytails", slug: "locs-low-ponytail" },
];

type State = {
  path: "discovery" | "direct";
  step: number;
  category?: Service["category"];
  look?: Look;
  serviceId?: string;
  options: Record<string, string>;
  date?: string;
  time?: string;
  altDate?: string;
  altTime?: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
  notify: "email" | "sms" | "link";
  policy: boolean;
};

const STORAGE = "cbc-booking";

export function BookingWizard({
  services,
  gallery,
  requestsOpen,
  whatsappUrl,
  initialPath,
  initialCategory,
  initialLook,
  initialService,
}: {
  services: Service[];
  gallery: Look[];
  requestsOpen: boolean;
  whatsappUrl: string;
  initialPath: "discovery" | "direct";
  initialCategory?: string;
  initialLook?: string;
  initialService?: string;
}) {
  const offline = useOffline();
  const [error, setError] = useState<string | null>(null);
  const [slots, setSlots] = useState<{ labelDate: string; labelTime: string }[]>([]);
  const [lightbox, setLightbox] = useState<Look | null>(null);
  const [state, setState] = useState<State>(() => ({
    path: initialPath,
    step: initialPath === "direct" ? 1 : 1,
    category: (initialCategory as State["category"]) || undefined,
    options: {},
    name: "",
    phone: "",
    email: "",
    notes: "",
    notify: "email",
    policy: false,
  }));

  const [ready, setReady] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const saved = sessionStorage.getItem(STORAGE);
    if (saved && !initialLook && !initialService && !initialCategory) {
      const parsed = JSON.parse(saved) as State;
      if (parsed.path === initialPath) setState(parsed);
    } else if (initialLook) {
      const look = gallery.find((g) => g.slug === initialLook);
      if (look) {
        setState((s) => ({
          ...s,
          look,
          category: look.category ?? s.category,
          serviceId: look.service?.id ?? s.serviceId,
          step: 3,
        }));
      }
    } else if (initialService) {
      const svc = services.find((x) => x.slug === initialService);
      if (svc) setState((s) => ({ ...s, path: "direct", serviceId: svc.id, category: svc.category, step: 2 }));
    } else if (initialCategory) {
      setState((s) => ({ ...s, category: initialCategory as State["category"], step: 2 }));
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready) return;
    sessionStorage.setItem(
      STORAGE,
      JSON.stringify({ ...state, look: state.look ? { ...state.look, service: state.look.service } : undefined }),
    );
  }, [ready, state]);

  const service = services.find((s) => s.id === state.serviceId) ?? state.look?.service ?? null;
  const looks = gallery.filter((g) => !state.category || g.category === state.category);

  useEffect(() => {
    if (!service?.id) return;
    getAvailabilityAction(service.id).then((res) => setSlots(res.slots));
  }, [service?.id]);

  const dates = useMemo(() => Array.from(new Set(slots.map((s) => s.labelDate))), [slots]);
  const times = slots.filter((s) => s.labelDate === state.date);

  const maxStep = state.path === "direct" ? 4 : 5;
  const stepTitle =
    state.path === "discovery"
      ? ["What are we doing today?", "Find a look you love.", "Make it yours.", "What day works for you?", "How can Chrissy reach you?"][state.step - 1]
      : ["Choose your service", "Make it yours.", "What day works for you?", "How can Chrissy reach you?"][state.step - 1];

  function go(step: number) {
    setError(null);
    setState((s) => ({ ...s, step: Math.min(maxStep, Math.max(1, step)) }));
  }

  if (!requestsOpen) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="font-serif text-4xl text-ink">Online requests aren’t open yet</h1>
        <p className="mt-4 text-muted">
          You can still browse styles and message Chrissy. Working days and service times are being confirmed.
        </p>
        <Button href={whatsappUrl} variant="lilac" className="mt-6">
          WhatsApp Chrissy
        </Button>
      </main>
    );
  }

  if (!ready) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <p>Loading your look…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1fr_280px]">
      <div>
        <p className="text-sm text-plum">
          Step {state.step} of {maxStep}
        </p>
        <h1 className="mt-2 font-serif text-4xl text-ink">{stepTitle}</h1>

        {state.path === "discovery" && state.step === 1 ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {CATS.map((cat) => (
                <button
                key={cat.key}
                type="button"
                aria-label={cat.label}
                data-testid={`category-${cat.key}`}
                onClick={() => setState((s) => ({ ...s, category: cat.key, step: 2 }))}
                className={`relative min-h-48 overflow-hidden rounded-3xl text-left ring-2 ${state.category === cat.key ? "ring-lilac" : "ring-transparent"}`}
              >
                <Photo base={`/media/derived/${cat.slug}`} alt="" />
                <span className="absolute inset-0 bg-ink/30" />
                <span className="absolute bottom-4 left-4 font-serif text-2xl text-cream">{cat.label}</span>
              </button>
            ))}
          </div>
        ) : null}

        {((state.path === "discovery" && state.step === 2) || (state.path === "direct" && state.step === 1)) && state.path === "direct" ? (
          <ul className="mt-8 space-y-3">
            {services.map((svc) => (
              <li key={svc.id}>
                  <button
                  type="button"
                  data-testid={`service-${svc.slug}`}
                  onClick={() => setState((s) => ({ ...s, serviceId: svc.id, category: svc.category, step: 2 }))}
                  className={`w-full rounded-2xl border px-4 py-4 text-left ${state.serviceId === svc.id ? "border-lilac bg-lilac/20" : "border-ink/10 bg-white"}`}
                >
                  <span className="font-medium text-ink">{svc.name}</span>
                  <span className="mt-1 block text-plum">{priceLabel(svc)}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {state.path === "discovery" && state.step === 2 ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {looks.map((look) => (
              <article key={look.id} className="overflow-hidden rounded-3xl bg-white">
                <div className="relative">
                  <button type="button" className="block aspect-[3/4] w-full" onClick={() => setLightbox(look)}>
                    <Photo base={look.derivedBase} alt={look.alt} focalX={look.focalX} focalY={look.focalY} />
                  </button>
                  <FavouriteButton id={look.id} />
                </div>
                <div className="p-4">
                  <p className="font-serif text-xl">{look.caption}</p>
                  <p className="text-sm text-muted">{look.service ? priceLabel(look.service) : "Ask Chrissy"}</p>
                  <Button
                    className="mt-3 w-full"
                    variant="lilac"
                    onClick={() =>
                      setState((s) => ({
                        ...s,
                        look,
                        serviceId: look.service?.id,
                        category: look.category ?? s.category,
                        step: 3,
                      }))
                    }
                  >
                    Request This Look
                  </Button>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        {((state.path === "discovery" && state.step === 3) || (state.path === "direct" && state.step === 2)) && service ? (
          <div className="mt-8 space-y-6">
            <p className="text-lg text-ink">{service.name}</p>
            {service.optionGroups.length ? (
              service.optionGroups.map((group) => (
                <fieldset key={group.id}>
                  <legend className="mb-2 font-medium">{group.name}</legend>
                  <div className="flex flex-wrap gap-2">
                    {group.options.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setState((s) => ({ ...s, options: { ...s.options, [group.name]: opt.label } }))}
                        className={`min-h-11 rounded-full border px-4 ${state.options[group.name] === opt.label ? "border-lilac bg-lilac text-ink" : "border-ink/15 bg-white"}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </fieldset>
              ))
            ) : (
              <p className="text-muted">No extra options for this service. Chrissy will confirm the details with you.</p>
            )}
            <a className="inline-block text-plum underline" href={whatsappUrl}>
              Not sure? Ask Chrissy.
            </a>
            {isQuote(service) ? (
              <p className="rounded-2xl bg-tan p-4">Pricing depends on size and length. Chrissy will confirm your quote before any payment.</p>
            ) : null}
            <Button variant="lilac" onClick={() => go(state.path === "direct" ? 3 : 4)}>
              Continue
            </Button>
          </div>
        ) : null}

        {((state.path === "discovery" && state.step === 4) || (state.path === "direct" && state.step === 3)) ? (
          <div className="mt-8">
            {!service?.durationMinutes ? (
              <p>This service isn’t timed for online requests yet. Message Chrissy to plan it.</p>
            ) : (
              <>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {dates.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setState((s) => ({ ...s, date: d, time: undefined }))}
                      className={`min-h-11 shrink-0 rounded-full px-4 ${state.date === d ? "bg-lilac" : "bg-white border border-ink/10"}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {times.map((t) => (
                    <button
                      key={t.labelTime}
                      type="button"
                      onClick={() => setState((s) => ({ ...s, time: t.labelTime }))}
                      className={`min-h-11 rounded-xl ${state.time === t.labelTime ? "bg-plum text-cream" : "bg-white border border-ink/10"}`}
                    >
                      {formatClock(t.labelTime)}
                    </button>
                  ))}
                </div>
                <label className="mt-6 block text-sm">
                  Optional second choice
                  <input
                    className="mt-1 w-full rounded-xl border border-ink/15 bg-white px-3 py-3"
                    placeholder="Another date or time you’d consider"
                    value={state.notes.includes("Alternative:") ? "" : ""}
                    onChange={() => undefined}
                  />
                </label>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <select
                    className="min-h-12 rounded-xl border border-ink/15 bg-white px-3"
                    value={state.altDate || ""}
                    onChange={(e) => setState((s) => ({ ...s, altDate: e.target.value }))}
                    aria-label="Alternative date"
                  >
                    <option value="">Alternative date</option>
                    {dates.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <select
                    className="min-h-12 rounded-xl border border-ink/15 bg-white px-3"
                    value={state.altTime || ""}
                    onChange={(e) => setState((s) => ({ ...s, altTime: e.target.value }))}
                    aria-label="Alternative time"
                  >
                    <option value="">Alternative time</option>
                    {slots.filter((s) => s.labelDate === (state.altDate || state.date)).map((t) => (
                      <option key={t.labelTime} value={t.labelTime}>
                        {formatClock(t.labelTime)}
                      </option>
                    ))}
                  </select>
                </div>
                <Button className="mt-6" variant="lilac" disabled={!state.date || !state.time} onClick={() => go(maxStep)}>
                  Continue
                </Button>
              </>
            )}
          </div>
        ) : null}

        {state.step === maxStep ? (
          <form
            className="mt-8 space-y-4"
            action={async (fd) => {
              if (offline) {
                setError("You’re offline. Requests can’t be sent until you’re back online.");
                return;
              }
              const result = await submitRequestAction(fd);
              if (result?.error) setError(result.error);
            }}
          >
            <input type="hidden" name="serviceId" value={service?.id || ""} />
            <input type="hidden" name="selectedOptions" value={JSON.stringify(state.options)} />
            <input type="hidden" name="date" value={state.date || ""} />
            <input type="hidden" name="time" value={state.time || ""} />
            <input type="hidden" name="altDate" value={state.altDate || ""} />
            <input type="hidden" name="altTime" value={state.altTime || ""} />
            <input type="hidden" name="lookMediaId" value={state.look?.id || ""} />
            <input type="hidden" name="path" value={state.path === "direct" ? "DIRECT" : "DISCOVERY"} />
            <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />
            <label className="block">
              Name
              <input required name="name" className="mt-1 w-full rounded-xl border border-ink/15 px-3 py-3" value={state.name} onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))} />
            </label>
            <label className="block">
              Mobile number
              <input required name="phone" placeholder="+1 (242)" className="mt-1 w-full rounded-xl border border-ink/15 px-3 py-3" value={state.phone} onChange={(e) => setState((s) => ({ ...s, phone: e.target.value }))} />
            </label>
            <label className="block">
              Email {state.notify === "email" ? "(required for email updates)" : "(optional)"}
              <input name="email" type="email" className="mt-1 w-full rounded-xl border border-ink/15 px-3 py-3" value={state.email} onChange={(e) => setState((s) => ({ ...s, email: e.target.value }))} />
            </label>
            <label className="block">
              Notes
              <textarea name="notes" className="mt-1 w-full rounded-xl border border-ink/15 px-3 py-3" rows={3} value={state.notes} onChange={(e) => setState((s) => ({ ...s, notes: e.target.value }))} />
            </label>
            <label className="block">
              Inspiration photo (private)
              <input name="inspiration" type="file" accept="image/jpeg,image/png,image/webp" className="mt-1 block w-full" />
            </label>
            <fieldset>
              <legend className="mb-2">How should we send updates?</legend>
              {[
                ["email", "Email"],
                ["sms", "Text message (when SMS is configured)"],
                ["link", "I’ll use my booking link"],
              ].map(([v, l]) => (
                <label key={v} className="mr-4 inline-flex items-center gap-2">
                  <input type="radio" name="notify" value={v} checked={state.notify === v} onChange={() => setState((s) => ({ ...s, notify: v as State["notify"] }))} />
                  {l}
                </label>
              ))}
            </fieldset>
            <label className="flex items-start gap-2">
              <input type="checkbox" name="policy" required checked={state.policy} onChange={(e) => setState((s) => ({ ...s, policy: e.target.checked }))} />
              <span>
                I understand this is a request, not a confirmed booking, and I agree to the{" "}
                <a className="underline" href="/policies">
                  booking and deposit policy
                </a>
                .
              </span>
            </label>
            {error ? <p className="text-plum">{error}</p> : null}
            <Button type="submit" variant="lilac" disabled={offline} className="w-full">
              Send request
            </Button>
            <CrownMark />
          </form>
        ) : null}

        <div className="mt-8 flex gap-3">
          {state.step > 1 ? (
            <Button variant="ghost" onClick={() => go(state.step - 1)}>
              Back
            </Button>
          ) : null}
        </div>
      </div>

      <aside className="h-fit rounded-3xl bg-white p-4 lg:sticky lg:top-6" aria-live="polite">
        <p className="text-sm uppercase tracking-widest text-plum">Your look</p>
        {state.look ? (
          <div className="mt-3 overflow-hidden rounded-2xl">
            <Photo base={state.look.derivedBase} alt={state.look.alt} />
          </div>
        ) : null}
        <p className="mt-3 font-medium">{service?.name || "Service to choose"}</p>
        <p className="text-sm text-muted">{service ? priceLabel(service) : "—"}</p>
        <ul className="mt-3 text-sm text-muted">
          {Object.entries(state.options).map(([k, v]) => (
            <li key={k}>
              {k}: {v}
            </li>
          ))}
          <li>
            {state.date && state.time ? `${state.date} · ${formatClock(state.time)}` : "Date to choose"}
          </li>
        </ul>
        <div className="mt-4 flex flex-col gap-2 text-sm">
          <button className="text-left underline" type="button" onClick={() => go(1)}>
            Edit choices
          </button>
        </div>
      </aside>

      {lightbox ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4" role="dialog" aria-modal>
          <button className="absolute right-4 top-4 text-cream" type="button" onClick={() => setLightbox(null)}>
            Close
          </button>
          <div className="max-h-[90vh] max-w-3xl overflow-hidden rounded-3xl">
            <Photo base={lightbox.derivedBase} alt={lightbox.alt} widthHint={1600} />
          </div>
        </div>
      ) : null}
    </main>
  );
}

function isQuote(service: Service) {
  return service.pricingType === "QUOTE_REQUIRED";
}
