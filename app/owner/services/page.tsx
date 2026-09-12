import { prisma } from "@/lib/db";
import { priceLabel } from "@/lib/pricing";
import { saveServiceAction } from "../actions";
import { formatMoney } from "@/lib/money";

export default async function ServicesAdmin() {
  const services = await prisma.service.findMany({ orderBy: { displayOrder: "asc" } });
  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      <h1 className="font-serif text-3xl">Services</h1>
      <div className="mt-6 space-y-6">
        {services.map((s) => (
          <form key={s.id} action={saveServiceAction} className="space-y-2 rounded-2xl bg-white p-4">
            <input type="hidden" name="id" value={s.id} />
            <input name="name" defaultValue={s.name} className="w-full rounded-xl border px-3 py-2" />
            <textarea name="description" defaultValue={s.description} className="w-full rounded-xl border px-3 py-2" />
            <select name="pricingType" defaultValue={s.pricingType} className="w-full rounded-xl border px-3 py-2">
              <option value="FIXED">Fixed</option>
              <option value="STARTING_FROM">Starting from</option>
              <option value="RANGE">Range</option>
              <option value="QUOTE_REQUIRED">Quote required</option>
            </select>
            <input name="priceMin" type="number" step="0.01" defaultValue={s.priceMinMinor != null ? s.priceMinMinor / 100 : ""} placeholder="Min B$" className="w-full rounded-xl border px-3 py-2" />
            <input name="priceMax" type="number" step="0.01" defaultValue={s.priceMaxMinor != null ? s.priceMaxMinor / 100 : ""} placeholder="Max B$" className="w-full rounded-xl border px-3 py-2" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="openEnded" defaultChecked={s.priceMaxOpenEnded} /> Open-ended upper price
            </label>
            <input name="duration" type="number" defaultValue={s.durationMinutes ?? ""} placeholder="Duration minutes" className="w-full rounded-xl border px-3 py-2" />
            <input name="buffer" type="number" defaultValue={s.bufferMinutes} placeholder="Buffer" className="w-full rounded-xl border px-3 py-2" />
            <input name="displayOrder" type="number" defaultValue={s.displayOrder} className="w-full rounded-xl border px-3 py-2" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="active" defaultChecked={s.active} /> Active
            </label>
            <p className="text-sm text-muted">Currently {priceLabel(s)}</p>
            <button className="min-h-11 w-full rounded-full bg-plum text-cream">Save</button>
          </form>
        ))}
      </div>
    </main>
  );
}

void formatMoney;
