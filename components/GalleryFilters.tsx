"use client";

import { useState } from "react";

const CATS = ["ALL", "LOCS", "BRAIDS", "SEW_INS", "PONYTAILS"] as const;

export function GalleryFilters() {
  const [cat, setCat] = useState<(typeof CATS)[number]>("ALL");
  return (
    <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Filter styles">
      {CATS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => {
            setCat(c);
            document.querySelectorAll<HTMLElement>("[data-category]").forEach((el) => {
              el.style.display = c === "ALL" || el.dataset.category === c ? "" : "none";
            });
          }}
          className={`min-h-11 rounded-full px-4 ${cat === c ? "bg-lilac text-ink" : "bg-white border border-ink/10"}`}
        >
          {c === "ALL" ? "All" : c.replace("_", "-").toLowerCase()}
        </button>
      ))}
    </div>
  );
}
