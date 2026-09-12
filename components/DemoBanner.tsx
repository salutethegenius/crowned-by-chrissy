import { isDemoMode } from "@/lib/env";

export async function DemoBanner() {
  if (!isDemoMode()) return null;
  return (
    <div className="bg-plum text-cream px-4 py-2 text-center text-sm" role="status">
      Demo mode — sample appointments and simulated payments only. No real charges or customer messages.
    </div>
  );
}
