"use client";

import { useState } from "react";

// Heart toggle. State is local for now — there is no wishlist backend yet.
export function WishlistButton({ productName }: { productName: string }) {
  const [saved, setSaved] = useState(false);

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={`${saved ? "Remove from" : "Add to"} wishlist: ${productName}`}
      onClick={() => setSaved((value) => !value)}
      className="absolute top-3 right-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-transform duration-300 hover:scale-110 active:scale-95"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={`h-5 w-5 transition-all duration-300 ${
          saved
            ? "scale-110 fill-[#e0245e] stroke-[#e0245e]"
            : "fill-transparent stroke-[#222]"
        }`}
        strokeWidth="1.8"
        strokeLinejoin="round"
      >
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    </button>
  );
}
