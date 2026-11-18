"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import type { Product } from "@/data/products";
import {
  clearCart,
  MAX_QTY,
  removeFromCart,
  setCartQuantity,
  useCart,
} from "@/lib/cart";
import { useHydrated } from "@/lib/persistent-store";

const rupees = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
});

const stepButton =
  "grid h-full w-10 cursor-pointer place-items-center text-[#444] transition-colors duration-300 hover:bg-[#fbf3e0] hover:text-brand-gold-dark disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-[#444] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-gold";

function QuantityStepper({
  name,
  qty,
  onChange,
}: {
  name: string;
  qty: number;
  onChange: (qty: number) => void;
}) {
  return (
    <div
      role="group"
      aria-label={`Quantity of ${name}`}
      className="inline-flex h-10 items-stretch overflow-hidden rounded-full border border-[#e2d5b6] bg-white"
    >
      <button
        type="button"
        aria-label={`Decrease quantity of ${name}`}
        disabled={qty <= 1}
        onClick={() => onChange(qty - 1)}
        className={stepButton}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-3.5 w-3.5 fill-none stroke-current"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M5 12h14" />
        </svg>
      </button>
      <span
        aria-live="polite"
        className="grid w-9 place-items-center font-system text-[15px] font-semibold text-[#222]"
      >
        {qty}
      </span>
      <button
        type="button"
        aria-label={`Increase quantity of ${name}`}
        disabled={qty >= MAX_QTY}
        onClick={() => onChange(qty + 1)}
        className={stepButton}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-3.5 w-3.5 fill-none stroke-current"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M5 12h14M12 5v14" />
        </svg>
      </button>
    </div>
  );
}

// The /cart page body: the products added with the "Add to cart" buttons (see
// lib/cart.ts), each with a quantity stepper and a remove link, plus an order
// summary. The cart only exists in the browser, so the server HTML is an empty
// placeholder and the real content appears once the page is interactive —
// otherwise a visitor with items would first see "Your cart is empty" flash by.
export function CartView({ catalogue }: { catalogue: Product[] }) {
  const { lines } = useCart();
  const hydrated = useHydrated();
  const bySlug = useMemo(
    () => new Map(catalogue.map((product) => [product.slug, product])),
    [catalogue],
  );

  const rows = lines.flatMap((line) => {
    const product = bySlug.get(line.slug);
    return product ? [{ product, qty: line.qty }] : [];
  });
  const itemCount = rows.reduce((total, row) => total + row.qty, 0);
  const subtotal = rows.reduce((total, row) => total + row.product.price * row.qty, 0);
  const savings = rows.reduce(
    (total, row) =>
      total + Math.max(0, (row.product.regularPrice ?? row.product.price) - row.product.price) * row.qty,
    0,
  );

  return (
    <section className="bg-brand-cream">
      <div className="mx-auto max-w-[1290px] px-6 pt-12 pb-20 md:pt-16 md:pb-28">
        <div className="pb-10 text-center md:pb-12">
          <h1 className="font-serif text-[32px] leading-[1.2] font-medium text-[#222] sm:text-[40px]">
            Shopping Cart
          </h1>
          <div aria-hidden="true" className="mt-5 flex items-center justify-center gap-3">
            <span className="h-px w-12 bg-gradient-to-r from-transparent to-[#C89B3C]" />
            <span className="h-2 w-2 rotate-45 bg-[#C89B3C]" />
            <span className="h-px w-12 bg-gradient-to-l from-transparent to-[#C89B3C]" />
          </div>
          <p
            aria-live="polite"
            className="mt-5 min-h-6 font-sans text-[15px] leading-6 text-[#777]"
          >
            {hydrated && itemCount > 0
              ? `${itemCount} ${itemCount === 1 ? "item" : "items"} in your cart`
              : null}
          </p>
        </div>

        {!hydrated ? (
          <div aria-hidden="true" className="min-h-[320px]" />
        ) : rows.length === 0 ? (
          <div className="mx-auto flex max-w-[420px] flex-col items-center py-6 text-center md:py-10">
            <span className="grid h-20 w-20 place-items-center rounded-full bg-white text-[#C89B3C] shadow-[0_18px_36px_-20px_rgba(120,85,20,0.5)] ring-1 ring-[#C89B3C]/40">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-9 w-9 fill-none stroke-current"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 4h2.2l2.1 10.2a1.5 1.5 0 0 0 1.5 1.2h8.1a1.5 1.5 0 0 0 1.5-1.1L20 8H6.2" />
                <circle cx="9.5" cy="19.5" r="1.3" />
                <circle cx="17" cy="19.5" r="1.3" />
              </svg>
            </span>
            <h2 className="mt-6 font-serif text-[24px] leading-snug text-[#222]">
              Your cart is empty
            </h2>
            <p className="mt-3 font-sans text-[15px] leading-7 text-[#777]">
              Add something you love and it will show up here.
            </p>
            <Link
              href="/shop"
              className="mt-8 inline-flex h-[52px] items-center rounded-full bg-brand-gold px-8 font-system text-[13px] font-bold tracking-[0.12em] whitespace-nowrap text-white uppercase shadow-[0_14px_24px_-12px_rgba(184,121,31,0.8)] transition-[background-color,transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:bg-brand-gold-dark hover:shadow-[0_18px_28px_-12px_rgba(184,121,31,0.9)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold"
            >
              Continue shopping
            </Link>
          </div>
        ) : (
          <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12">
            <div>
              <ul className="divide-y divide-[#e9e1cf] border-y border-[#e9e1cf]">
                {rows.map(({ product, qty }) => {
                  const href = `/product/${product.slug}`;
                  const onOffer =
                    product.regularPrice !== undefined && product.regularPrice > product.price;
                  return (
                    <li
                      key={product.slug}
                      className="grid grid-cols-[84px_minmax(0,1fr)] gap-x-4 gap-y-4 py-6 sm:grid-cols-[112px_minmax(0,1fr)_auto] sm:gap-x-6 sm:gap-y-3"
                    >
                      <Link
                        href={href}
                        tabIndex={-1}
                        aria-hidden="true"
                        className="relative aspect-[3/4] overflow-hidden rounded-[10px] bg-white ring-1 ring-[#e9e1cf] sm:row-span-2 sm:self-center"
                      >
                        <Image
                          src={product.image}
                          alt=""
                          fill
                          sizes="112px"
                          className="object-cover"
                        />
                      </Link>

                      <div className="min-w-0 sm:self-end">
                        <h3 className="font-serif text-[18px] leading-snug text-[#222] sm:text-[21px]">
                          <Link
                            href={href}
                            className="transition-colors duration-300 hover:text-brand-gold-dark"
                          >
                            {product.name}
                          </Link>
                        </h3>
                        <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2.5 font-system text-[15px]">
                          {onOffer ? (
                            <>
                              <del className="text-[#9b9b9b]">
                                <span className="sr-only">Original price was </span>
                                {rupees.format(product.regularPrice!)}
                              </del>
                              <ins className="font-semibold text-brand-gold-dark no-underline">
                                <span className="sr-only">Current price is </span>
                                {rupees.format(product.price)}
                              </ins>
                            </>
                          ) : (
                            <span className="font-semibold text-[#222]">
                              {rupees.format(product.price)}
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Phones: stepper left, total + remove right, one row under the
                          photo and name. sm+: stepper under the name, total on the right. */}
                      <div className="col-span-2 col-start-1 row-start-2 justify-self-start sm:col-span-1 sm:col-start-2 sm:self-start">
                        <QuantityStepper
                          name={product.name}
                          qty={qty}
                          onChange={(next) => setCartQuantity(product.slug, next)}
                        />
                      </div>

                      <div className="col-span-2 col-start-1 row-start-2 flex items-center gap-4 justify-self-end sm:col-span-1 sm:col-start-3 sm:row-span-2 sm:row-start-1 sm:flex-col sm:items-end sm:justify-center sm:gap-2">
                        <p className="font-system text-[18px] font-semibold text-[#222]">
                          <span className="sr-only">Line total </span>
                          {rupees.format(product.price * qty)}
                        </p>
                        <button
                          type="button"
                          aria-label={`Remove ${product.name} from cart`}
                          onClick={() => removeFromCart(product.slug)}
                          className="cursor-pointer font-system text-[13px] text-[#777] underline-offset-4 transition-colors duration-300 hover:text-brand-gold-dark hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold"
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 font-system text-[14px]">
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 text-[#444] transition-colors duration-300 hover:text-brand-gold-dark"
                >
                  <span aria-hidden="true">←</span> Continue shopping
                </Link>
                <button
                  type="button"
                  onClick={clearCart}
                  className="cursor-pointer text-[#777] underline-offset-4 transition-colors duration-300 hover:text-brand-gold-dark hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold"
                >
                  Clear cart
                </button>
              </div>
            </div>

            <aside
              aria-labelledby="cart-summary-title"
              className="rounded-2xl border border-[#eadcb6] bg-white p-6 shadow-[0_18px_36px_-28px_rgba(120,85,20,0.5)] sm:p-8 lg:sticky lg:top-[150px]"
            >
              <h2 id="cart-summary-title" className="font-serif text-[24px] text-[#222]">
                Order Summary
              </h2>
              <dl className="mt-6 space-y-3 font-system text-[15px] text-[#444]">
                <div className="flex justify-between gap-4">
                  <dt>
                    Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
                  </dt>
                  <dd className="font-semibold text-[#222]">{rupees.format(subtotal)}</dd>
                </div>
                {savings > 0 && (
                  <div className="flex justify-between gap-4 text-brand-gold-dark">
                    <dt>You save</dt>
                    <dd className="font-semibold">{rupees.format(savings)}</dd>
                  </div>
                )}
              </dl>
              <span
                aria-hidden="true"
                className="my-5 block h-px w-full bg-gradient-to-r from-[#d9bd7a] via-[#eadcb6] to-transparent"
              />
              <p className="flex items-baseline justify-between gap-4 font-system">
                <span className="text-[16px] font-semibold text-[#222]">Total</span>
                <span className="text-[26px] font-semibold text-[#222]">
                  {rupees.format(subtotal)}
                </span>
              </p>
              {/* No checkout yet: this points at where it will live. */}
              <Link
                href="/checkout"
                prefetch={false}
                className="mt-6 flex h-[52px] items-center justify-center rounded-full bg-brand-gold px-6 font-system text-[13px] font-bold tracking-[0.12em] whitespace-nowrap text-white uppercase shadow-[0_14px_24px_-12px_rgba(184,121,31,0.8)] transition-[background-color,transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:bg-brand-gold-dark hover:shadow-[0_18px_28px_-12px_rgba(184,121,31,0.9)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold"
              >
                Proceed to checkout
              </Link>
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}
