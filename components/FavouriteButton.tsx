"use client";

import { useEffect, useState } from "react";

const KEY = "cbc-favourites";

export function FavouriteButton({ id }: { id: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(KEY) || "[]") as string[];
    setOn(stored.includes(id));
  }, [id]);
  return (
    <button
      type="button"
      className="absolute right-3 top-3 inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-cream/90 text-ink"
      aria-pressed={on}
      aria-label={on ? "Remove from saved looks" : "Save this look"}
      onClick={(e) => {
        e.preventDefault();
        const stored = JSON.parse(localStorage.getItem(KEY) || "[]") as string[];
        const next = stored.includes(id) ? stored.filter((x) => x !== id) : [...stored, id];
        localStorage.setItem(KEY, JSON.stringify(next));
        setOn(next.includes(id));
      }}
    >
      {on ? "♥" : "♡"}
    </button>
  );
}

export function readFavourites() {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem(KEY) || "[]") as string[];
}
