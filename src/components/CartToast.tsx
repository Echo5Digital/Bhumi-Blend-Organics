"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CART_ADDED_EVENT, MAX_QTY, type CartAddedDetail } from "@/lib/cart";

const VISIBLE_MS = 5000;

type Toast = { id: number; name: string; added: number };

// Small confirmation that drops in at the top of the screen, just under the
// sticky header (beside the cart icon), whenever something is added to the
// cart: what was added, plus a "View cart" link. Nothing navigates by itself —
// the visitor chooses. Mounted once, in the root layout. It dismisses itself
// after a few seconds (paused while the pointer is over it or focus is inside).
export function CartToast() {
  const [toast, setToast] = useState<Toast | null>(null);
  const [paused, setPaused] = useState(false);
  // Distance from the top of the screen: the header's bottom edge plus a gap.
  // The header's height changes with the screen size, so it is measured each
  // time a toast appears instead of being hard-coded.
  const [top, setTop] = useState(16);
  const nextId = useRef(0);

  useEffect(() => {
    const onAdded = (event: Event) => {
      const { name, added } = (event as CustomEvent<CartAddedDetail>).detail;
      const header = document.querySelector("header");
      setTop(header ? Math.round(header.getBoundingClientRect().bottom) + 12 : 16);
      nextId.current += 1;
      setToast({ id: nextId.current, name, added });
    };
    window.addEventListener(CART_ADDED_EVENT, onAdded);
    return () => window.removeEventListener(CART_ADDED_EVENT, onAdded);
  }, []);

  // Every new toast restarts the countdown.
  useEffect(() => {
    if (!toast || paused) return;
    const timer = window.setTimeout(() => setToast(null), VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [toast, paused]);

  return (
    // The live region stays mounted so screen readers announce what appears in it.
    <div
      role="status"
      aria-live="polite"
      style={{ top }}
      className="pointer-events-none fixed inset-x-4 z-[60] sm:inset-x-auto sm:right-6 sm:w-[400px]"
    >
      {toast && (
        <div
          key={toast.id}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          className="cart-toast pointer-events-auto flex items-center gap-3 rounded-2xl border border-[#C89B3C]/40 bg-white p-3.5 shadow-[0_24px_50px_-20px_rgba(90,60,10,0.55)]"
        >
          <span
            aria-hidden="true"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#eac66e] to-[#b8791f] text-white"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 fill-none stroke-current"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </span>

          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 font-system text-[14px] leading-snug font-semibold text-[#222]">
              {toast.name}
            </p>
            <p className="font-system text-[13px] leading-snug text-[#666]">
              {toast.added > 0
                ? "Added to your cart"
                : `Your cart already has the maximum (${MAX_QTY})`}
            </p>
          </div>

          <Link
            href="/cart"
            onClick={() => setToast(null)}
            className="shrink-0 rounded-full bg-brand-gold px-4 py-2.5 font-system text-[12px] font-bold tracking-[0.1em] text-white uppercase transition-colors duration-300 hover:bg-brand-gold-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold"
          >
            View cart
          </Link>

          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setToast(null)}
            className="-mr-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#777] transition-colors duration-300 hover:bg-[#f4efe2] hover:text-[#222] focus-visible:outline-2 focus-visible:outline-brand-gold"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-4 w-4 fill-none stroke-current"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
