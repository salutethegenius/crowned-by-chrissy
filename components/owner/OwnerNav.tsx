"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const items = [
  { href: "/owner", label: "Today" },
  { href: "/owner/requests", label: "Requests" },
  { href: "/owner/calendar", label: "Calendar" },
  { href: "/owner/more", label: "More" },
];

export function OwnerNav() {
  const path = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-ink/10 bg-white/95 backdrop-blur" aria-label="Owner">
      <ul className="mx-auto grid max-w-lg grid-cols-4">
        {items.map((item) => {
          const active = item.href === "/owner" ? path === "/owner" : path.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex min-h-14 items-center justify-center text-sm",
                  active ? "font-semibold text-plum" : "text-muted",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
