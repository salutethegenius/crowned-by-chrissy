"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "./Logo";
import { cn } from "@/lib/cn";

const links = [
  { href: "/styles", label: "Styles" },
  { href: "/services", label: "Services" },
  { href: "/meet", label: "Meet Chrissy" },
];

export function SiteHeader({ dark = false }: { dark?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <header
      className={cn(
        "relative z-30",
        dark ? "text-cream" : "text-ink bg-cream/90 backdrop-blur border-b border-ink/5",
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Logo light={dark} />
        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="tracking-wide hover:text-gold">
              {l.label}
            </Link>
          ))}
          <Link
            href="/book"
            className="inline-flex min-h-11 items-center rounded-full bg-lilac px-5 font-medium text-ink hover:bg-cream"
          >
            Book
          </Link>
        </nav>
        <div className="flex items-center gap-2 md:hidden">
          <Link
            href="/book"
            className="inline-flex min-h-11 items-center rounded-full bg-lilac px-4 font-medium text-ink"
          >
            Book
          </Link>
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-current/30"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <span aria-hidden className="text-lg">
              {open ? "×" : "☰"}
            </span>
          </button>
        </div>
      </div>
      {open ? (
        <nav id="mobile-nav" className="border-t border-current/10 px-4 py-4 md:hidden" aria-label="Mobile">
          <ul className="flex flex-col gap-3 text-lg">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="block min-h-11 py-2" onClick={() => setOpen(false)}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
