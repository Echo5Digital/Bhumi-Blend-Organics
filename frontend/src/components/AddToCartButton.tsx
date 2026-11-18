"use client";

import { addToCart } from "@/lib/cart";

// The "Add to cart" button used on product cards. It only puts the product in
// the cart (see lib/cart.ts) — the header badge counts it, the toast confirms
// it and it is listed on /cart; it never navigates anywhere by itself.
// Each card passes its own look through `className` / `children`.
export function AddToCartButton({
  slug,
  productName,
  className,
  children,
}: {
  slug: string;
  productName: string;
  className?: string;
  children: React.ReactNode;
}) {
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
