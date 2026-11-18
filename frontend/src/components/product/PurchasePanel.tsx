"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { addToCart, MAX_QTY } from "@/lib/cart";

const stepperButton =
  "grid h-full w-11 cursor-pointer place-items-center text-[#444] transition-colors duration-300 hover:bg-[#fbf3e0] hover:text-brand-gold-dark disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-[#444] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-gold";

// Quantity + "Add to cart" + "Buy It Now". "Add to cart" puts the chosen
// quantity in the cart (lib/cart.ts) and stays on the page. "Buy It Now" puts
// it in the cart the same way (no toast — the page is about to change) and goes
// straight to /checkout, which checks out the cart.
export function PurchasePanel({ slug, productName, soldOut = false }: { slug: string; productName: string; soldOut?: boolean }) {
  const router = useRouter();
  const [qty, setQty] = useState(1);

  const clamp = (value: number) => Math.min(MAX_QTY, Math.max(1, value));

  // Sold out (switched off, or its stock count reached 0 in the admin): nothing to buy.
  if (soldOut) {
    return (
      <div>
        <button
          type="button"
          disabled
          className="h-[52px] w-full cursor-not-allowed rounded-full border border-[#d9d2bf] bg-[#ece7d8] px-4 font-system text-[13px] font-bold tracking-[0.12em] text-[#7a7468] uppercase"
        >
          Out of stock
        </button>
        <p className="mt-3 font-system text-[14px] text-[#777]">This product is currently unavailable. Please check back soon.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[auto_1fr] gap-3 sm:grid-cols-[auto_1fr_1fr] lg:grid-cols-[auto_1fr] xl:grid-cols-[auto_1fr_1fr]">
      <div
        role="group"
        aria-label="Quantity"
        className="flex h-[52px] items-stretch overflow-hidden rounded-full border border-[#e2d5b6] bg-white"
      >
        <button
          type="button"
          aria-label="Decrease quantity"
          disabled={qty <= 1}
          onClick={() => setQty((value) => clamp(value - 1))}
          className={stepperButton}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-4 w-4 fill-none stroke-current"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M5 12h14" />
          </svg>
        </button>
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={MAX_QTY}
          value={qty}
          aria-label={`Quantity of ${productName}`}
          onChange={(event) => setQty(clamp(Number(event.target.value) || 1))}
          className="w-9 [appearance:textfield] bg-transparent text-center font-system text-[16px] font-semibold text-[#222] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          type="button"
          aria-label="Increase quantity"
          disabled={qty >= MAX_QTY}
          onClick={() => setQty((value) => clamp(value + 1))}
          className={stepperButton}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-4 w-4 fill-none stroke-current"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M5 12h14M12 5v14" />
          </svg>
        </button>
      </div>

      <button
        type="button"
        onClick={() => addToCart({ slug, name: productName }, qty)}
        className="h-[52px] cursor-pointer rounded-full bg-brand-gold px-4 font-system text-[13px] font-bold tracking-[0.12em] whitespace-nowrap text-white uppercase shadow-[0_14px_24px_-12px_rgba(184,121,31,0.8)] transition-[background-color,transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:bg-brand-gold-dark hover:shadow-[0_18px_28px_-12px_rgba(184,121,31,0.9)] active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold"
      >
        Add to cart
      </button>

      <button
        type="button"
        onClick={() => {
          addToCart({ slug, name: productName }, qty, { announce: false });
          router.push("/checkout");
        }}
        className="col-span-2 h-[52px] cursor-pointer rounded-full border border-brand-gold bg-white px-4 font-system text-[13px] font-bold tracking-[0.12em] whitespace-nowrap text-brand-gold-dark uppercase transition-colors duration-300 hover:bg-[#fbf3e0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold sm:col-span-1 lg:col-span-2 xl:col-span-1"
      >
        Buy It Now
      </button>
    </div>
  );
}
