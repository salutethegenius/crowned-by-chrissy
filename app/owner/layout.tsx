import type { ReactNode } from "react";
import Link from "next/link";
import { getOwnerSession } from "@/lib/auth";
import { OwnerNav } from "@/components/owner/OwnerNav";
import { OwnerOfflineGuard } from "@/components/owner/OwnerOfflineGuard";
import { PwaRegister } from "@/components/owner/PwaRegister";

export const metadata = {
  title: "Owner",
  manifest: "/owner/manifest.webmanifest",
};

export default async function OwnerLayout({ children }: { children: ReactNode }) {
  const session = await getOwnerSession();
  if (!session) {
    return <>{children}</>;
  }
  return (
    <div className="flex min-h-screen flex-col bg-[#f7f3ee] text-ink">
      <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3">
        <p className="font-serif text-xl">Crowned by Chrissy</p>
        <Link href="/" className="text-sm text-plum">
          View site
        </Link>
      </div>
      <PwaRegister />
      <OwnerOfflineGuard />
      <div className="flex-1 pb-24">{children}</div>
      <OwnerNav />
    </div>
  );
}
