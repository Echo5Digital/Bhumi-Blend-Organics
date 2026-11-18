"use client";

import Image from "next/image";
import { useState } from "react";
import type { Product } from "@/data/products";
import { rupees } from "@/lib/checkout";

export type SummaryRow = { product: Product; qty: number; size?: string };
export type AppliedCoupon = { code: string; discount: number };

// The "Order summary" card beside the checkout form: what is being bought, a
// coupon box and the totals. Read-only — quantities are changed on /cart.
//
// The coupon box asks the backend (the coupons set up in the admin): `onApplyCoupon`
// returns null when the code was accepted, or the reason it wasn't.
export function OrderSummary({
  rows,
  subtotal,
  coupon,
  onApplyCoupon,
  onRemoveCoupon,
  className = "",
}: {
  rows: SummaryRow[];
  subtotal: number;
  coupon: AppliedCoupon | null;
  onApplyCoupon: (code: string) => Promise<string | null>;
  onRemoveCoupon: () => void;
  className?: string;
}) {
  const [couponsOpen, setCouponsOpen] = useState(false);
  const [code, setCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [applying, setApplying] = useState(false);
  const total = Math.max(0, subtotal - (coupon?.discount ?? 0));

  async function applyCoupon() {
    const trimmed = code.trim();
    if (!trimmed) {
      setCouponError("Please enter a coupon code.");
      return;
    }
    setApplying(true);
    setCouponError("");
    const problem = await onApplyCoupon(trimmed);
    setApplying(false);
    if (problem) setCouponError(problem);
    else setCode("");
  }

  return (
    <aside
      aria-labelledby="checkout-summary-title"
      className={`rounded-[4px] border border-[#dcdcdc] bg-white font-system text-[#1e1e1e] ${className}`}
    >
      {/* Headings are serif site-wide (globals.css), so this one asks for the system font itself. */}
      <h2
        id="checkout-summary-title"
        className="px-4 pt-4 pb-3 font-system text-[20px] leading-7 font-medium"
      >
        Order summary
      </h2>

      <ul className="px-4 pb-4">
        {rows.map(({ product, qty, size }) => {
          const onOffer = product.regularPrice !== undefined && product.regularPrice > product.price;
          const saved = onOffer ? (product.regularPrice! - product.price) * qty : 0;
          return (
            <li key={product.slug} className="flex gap-4 py-2 first:pt-1">
              <div className="relative h-16 w-12 shrink-0">
                <div className="relative h-full w-full overflow-hidden rounded-[3px] ring-1 ring-[#e6e6e6]">
                  <Image src={product.image} alt="" fill sizes="48px" className="object-cover" />
                </div>
                <span
                  aria-hidden="true"
                  className="absolute -top-2 -right-2 grid h-5 min-w-5 place-items-center rounded-full bg-[#1e1e1e] px-1 text-[11px] leading-none font-semibold text-white"
                >
                  {qty}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[14px] leading-5 font-semibold">
                    <span className="sr-only">Quantity {qty}: </span>
                    {product.name}
                  </p>
                  <p className="shrink-0 text-[14px] leading-5">
                    <span className="sr-only">Line total </span>
                    {rupees.format(product.price * qty)}
                  </p>
                </div>

                <div className="mt-1 flex items-start justify-between gap-3">
                  <p className="flex flex-wrap items-baseline gap-x-1.5 text-[13px] leading-5">
                    {onOffer && (
                      <del className="font-semibold">
                        <span className="sr-only">Original price </span>
                        {rupees.format(product.regularPrice!)}
                      </del>
                    )}
                    <span>
                      <span className="sr-only">Price </span>
                      {rupees.format(product.price)}
                    </span>
                  </p>
                  {saved > 0 && (
                    <p className="shrink-0 rounded-[3px] bg-[#f0f0f0] px-1.5 py-0.5 text-[12px] leading-4">
                      Save {rupees.format(saved)}
                    </p>
                  )}
                </div>

                {size && <p className="mt-1 text-[13px] leading-5 font-semibold">{size}</p>}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-[#dcdcdc]">
        <button
          type="button"
          aria-expanded={couponsOpen || coupon !== null}
          aria-controls="checkout-coupons"
          onClick={() => setCouponsOpen((open) => !open)}
          className="flex w-full cursor-pointer items-center justify-between px-4 py-4 text-left text-[14px] leading-5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-gold"
        >
          Add coupons
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className={`h-5 w-5 fill-none stroke-current transition-transform duration-200 ${couponsOpen || coupon ? "rotate-180" : ""}`}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {(couponsOpen || coupon) && (
          <div id="checkout-coupons" className="px-4 pb-4">
            {coupon ? (
              <p className="flex items-center justify-between gap-3 rounded-[4px] bg-[#f6f1e3] px-3 py-2 text-[14px]">
                <span>
                  <strong>{coupon.code}</strong> applied
                </span>
                <button
                  type="button"
                  onClick={onRemoveCoupon}
                  className="cursor-pointer text-[13px] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold"
                >
                  Remove
                </button>
              </p>
            ) : (
              <>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={code}
                    aria-label="Coupon code"
                    placeholder="Enter code"
                    aria-invalid={couponError ? true : undefined}
                    aria-describedby={couponError ? "checkout-coupon-error" : undefined}
                    onChange={(event) => {
                      setCode(event.target.value);
                      setCouponError("");
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void applyCoupon();
                      }
                    }}
                    className={`h-11 min-w-0 flex-1 rounded-[4px] border bg-white px-3 text-[14px] focus:outline-2 focus:outline-brand-gold ${couponError ? "border-[#cc1818]" : "border-[#757575]"}`}
                  />
                  <button
                    type="button"
                    disabled={applying}
                    onClick={() => void applyCoupon()}
                    className="h-11 cursor-pointer rounded-[4px] border border-[#1e1e1e] bg-white px-4 text-[14px] font-medium transition-colors duration-200 hover:bg-[#1e1e1e] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold disabled:cursor-wait disabled:opacity-60"
                  >
                    {applying ? "Checking…" : "Apply"}
                  </button>
                </div>
                {couponError && (
                  <p
                    id="checkout-coupon-error"
                    role="alert"
                    className="mt-1.5 text-[12px] leading-4 text-[#cc1818]"
                  >
                    {couponError}
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <dl className="space-y-3 border-t border-[#dcdcdc] px-4 py-4 text-[14px] leading-5">
        <div className="flex justify-between gap-4">
          <dt>Subtotal</dt>
          <dd>{rupees.format(subtotal)}</dd>
        </div>
        {coupon && (
          <div className="flex justify-between gap-4">
            <dt>Coupon ({coupon.code})</dt>
            <dd>−{rupees.format(coupon.discount)}</dd>
          </div>
        )}
        <div className="flex justify-between gap-4">
          <dt>Free shipping</dt>
          <dd className="font-semibold">FREE</dd>
        </div>
      </dl>

      <p className="flex items-baseline justify-between gap-4 border-t border-[#dcdcdc] px-4 py-4">
        <span className="text-[20px] leading-7 font-medium">Total</span>
        <span className="text-[22px] leading-7 font-medium">{rupees.format(total)}</span>
      </p>
    </aside>
  );
}
