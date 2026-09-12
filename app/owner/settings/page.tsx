import { getSettings, workingDaysList } from "@/lib/settings";
import { saveSettingsAction } from "../actions";
import { cngConfig, notificationProviders, isDemoMode } from "@/lib/env";
import { WEEKDAY_LABELS } from "@/lib/time";

export default async function SettingsPage() {
  const settings = await getSettings();
  const days = workingDaysList(settings);
  const cng = cngConfig();
  const notices = notificationProviders();
  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      <h1 className="font-serif text-3xl">Settings</h1>
      <form action={saveSettingsAction} className="mt-6 space-y-4 rounded-2xl bg-white p-4">
        <fieldset>
          <legend className="font-medium">Working days</legend>
          {WEEKDAY_LABELS.map((d) => (
            <label key={d.value} className="mt-2 flex items-center gap-2">
              <input type="checkbox" name="workingDays" value={d.value} defaultChecked={days.includes(d.value)} />
              {d.label}
            </label>
          ))}
        </fieldset>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="requestsOpen" defaultChecked={settings.requestsOpen} />
          Online requests open (requires working days)
        </label>
        <label className="block">Hours start
          <input name="hoursStart" defaultValue={settings.operatingHoursStart} className="mt-1 w-full rounded-xl border px-3 py-2" />
        </label>
        <label className="block">Hours end
          <input name="hoursEnd" defaultValue={settings.operatingHoursEnd} className="mt-1 w-full rounded-xl border px-3 py-2" />
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="depositsEnabled" defaultChecked={settings.depositsEnabled} /> Deposits enabled
        </label>
        <select name="depositType" defaultValue={settings.depositType} className="w-full rounded-xl border px-3 py-2">
          <option value="FIXED">Fixed amount</option>
          <option value="PERCENTAGE">Percentage</option>
        </select>
        <input name="depositAmount" type="number" step="0.01" defaultValue={settings.depositAmountMinor ? settings.depositAmountMinor / 100 : ""} placeholder="Default deposit B$" className="w-full rounded-xl border px-3 py-2" />
        <input name="depositPercent" type="number" defaultValue={settings.depositPercentBps ? settings.depositPercentBps / 100 : ""} placeholder="Default percent" className="w-full rounded-xl border px-3 py-2" />
        <input name="holdMinutes" type="number" defaultValue={settings.defaultHoldMinutes} className="w-full rounded-xl border px-3 py-2" />
        <label className="flex items-center gap-2">
          <input type="checkbox" name="fullPaymentOptional" defaultChecked={settings.fullPaymentOptional} /> Allow full payment after approval
        </label>
        <textarea name="address" defaultValue={settings.address ?? ""} placeholder="Address (hidden until you show it)" className="w-full rounded-xl border px-3 py-2" />
        <label className="flex items-center gap-2">
          <input type="checkbox" name="addressVisible" defaultChecked={settings.addressVisible} /> Show address publicly
        </label>
        <textarea name="biography" defaultValue={settings.biography ?? ""} placeholder="Approved biography" className="w-full rounded-xl border px-3 py-2" rows={4} />
        <button className="min-h-12 w-full rounded-full bg-plum text-cream">Save settings</button>
      </form>
      <section className="mt-8 rounded-2xl bg-white p-4 text-sm">
        <h2 className="font-medium">Integrations</h2>
        <ul className="mt-3 space-y-2">
          <li>Demo mode: {isDemoMode() ? "on" : "off"}</li>
          <li>Cash N’ Go configured: {cng.configured ? "yes" : "no"}</li>
          <li>Live charges enabled: {cng.canChargeLive ? "yes" : "no"}</li>
          <li>Currency confirmed: {cng.currencyConfirmed ? "yes" : "no"}</li>
          <li>Email provider: {notices.resend ? "Resend ready" : "not configured"}</li>
          <li>SMS provider: {notices.twilio ? "Twilio ready" : "not configured"}</li>
          <li>Push: {notices.push ? "VAPID present" : "not configured"}</li>
        </ul>
      </section>
    </main>
  );
}
