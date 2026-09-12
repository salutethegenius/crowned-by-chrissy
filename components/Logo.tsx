import Link from "next/link";
import { cn } from "@/lib/cn";

export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-3", className)} aria-label="Crowned by Chrissy home">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/media/derived/brand-crown/400.webp"
        alt=""
        width={48}
        height={48}
        className="h-12 w-12 object-contain"
      />
      <span className={cn("font-serif text-2xl tracking-wide", light ? "text-cream" : "text-ink")}>
        Crowned <span className="italic font-normal">by</span> Chrissy
      </span>
    </Link>
  );
}
