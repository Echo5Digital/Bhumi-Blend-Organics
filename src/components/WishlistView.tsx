"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/data/products";
import { useHydrated } from "@/lib/persistent-store";
import { useWishlist } from "@/lib/wishlist";

// The /wishlist page body: every product whose heart is switched on, newest
// first, as the same cards used on the homepage (so the heart on a card here
// removes it from the list). The saved slugs only exist in the browser, so the
// server HTML is an empty placeholder and the real content appears once the
// page is interactive — otherwise a visitor with saved items would first see
// "Your wishlist is empty" flash by.
export function WishlistView({ catalogue }: { catalogue: Product[] }) {
  const { slugs } = useWishlist();
  const hydrated = useHydrated();
  const bySlug = useMemo(
    () => new Map(catalogue.map((product) => [product.slug, product])),
    [catalogue],
  );

  const saved = [...slugs]
    .reverse()
    .map((slug) => bySlug.get(slug))
    .filter((product): product is Product => product !== undefined);

  return (
    <section className="bg-brand-cream">
      <div className="mx-auto max-w-[1290px] px-6 pt-12 pb-20 md:pt-16 md:pb-28">
        <div className="pb-10 text-center md:pb-12">
          <h1 className="font-serif text-[32px] leading-[1.2] font-medium text-[#222] sm:text-[40px]">
            My Wishlist
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
            {hydrated && saved.length > 0
              ? `${saved.length} ${saved.length === 1 ? "product" : "products"} saved`
              : null}
          </p>
        </div>

        {!hydrated ? (
          <div aria-hidden="true" className="min-h-[320px]" />
        ) : saved.length === 0 ? (
          <div className="mx-auto flex max-w-[420px] flex-col items-center py-6 text-center md:py-10">
            <span className="grid h-20 w-20 place-items-center rounded-full bg-white text-[#C89B3C] shadow-[0_18px_36px_-20px_rgba(120,85,20,0.5)] ring-1 ring-[#C89B3C]/40">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-9 w-9 fill-none stroke-current"
                strokeWidth="1.5"
                strokeLinejoin="round"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </span>
            <h2 className="mt-6 font-serif text-[24px] leading-snug text-[#222]">
              Your wishlist is empty
            </h2>
            <p className="mt-3 font-sans text-[15px] leading-7 text-[#777]">
              Tap the heart on any product to save it here.
            </p>
            <Link
              href="/shop"
              className="mt-8 inline-flex h-[52px] items-center rounded-full bg-brand-gold px-8 font-system text-[13px] font-bold tracking-[0.12em] whitespace-nowrap text-white uppercase shadow-[0_14px_24px_-12px_rgba(184,121,31,0.8)] transition-[background-color,transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:bg-brand-gold-dark hover:shadow-[0_18px_28px_-12px_rgba(184,121,31,0.9)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold"
            >
              Continue shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-14">
            {saved.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
