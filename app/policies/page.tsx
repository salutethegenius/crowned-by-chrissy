import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata = { title: "Booking & deposit policy" };

export default function PoliciesPage() {
  return (
    <div className="flex min-h-full flex-col bg-cream">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl px-4 py-16">
        <h1 className="font-serif text-4xl text-ink">Booking & deposits</h1>
        <div className="mt-8 space-y-6 text-lg text-body">
          <p>Sending a request does not confirm your appointment. Chrissy reviews every request first.</p>
          <p>
            Deposits are applied toward your service and are non-refundable. If you cancel, your deposit can be applied
            to a new appointment approved by Chrissy.
          </p>
          <p>A request alone does not hold a calendar time. After approval, a temporary hold is placed until the deposit is paid.</p>
          <p>If a hold expires unpaid, that time is released and you can send a new request.</p>
          <p>Prices shown are a guide. If your look needs a custom quote, Chrissy will confirm the amount before you pay.</p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
