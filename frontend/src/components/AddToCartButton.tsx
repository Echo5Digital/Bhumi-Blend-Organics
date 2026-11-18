"use client";

import { addToCart } from "@/lib/cart";

// The "Add to cart" button used on product cards. It only puts the product in
// the cart (see lib/cart.ts) — the header badge counts it, the toast confirms
// it and it is listed on /cart; it never navigates anywhere by itself.
// Each card passes its own look through `className` / `children`.
//
// A sold-out product (switched off, or its count reached 0 in the admin) gets a
// greyed, disabled "Out of stock" button in the same spot instead.
export function AddToCartButton({
  slug,
  productName,
  className,
  children,
  soldOut = false,
}: {
  slug: string;
  productName: string;
  className?: string;
  children: React.ReactNode;
  soldOut?: boolean;
}) {
  if (soldOut) {
    return (
      <button
        type="button"
        disabled
        aria-label={`${productName} is out of stock`}
        className={`${className ?? ""} cursor-not-allowed! border-[#d9d2bf]! bg-[#ece7d8]! text-[#7a7468]! shadow-none!`}
      >
        Out of stock
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label={`Add ${productName} to cart`}
      onClick={() => addToCart({ slug, name: productName })}
      className={className}
    >
      {children}
    </button>
  );
}
