"use client";

import { createPersistentStore } from "@/lib/persistent-store";

// The cart: product slug + quantity per line, kept in localStorage. Every
// "Add to cart" button, the header badge, the "added" toast and the /cart page
// use this one store. Prices and names are not stored — they are looked up
// from the catalogue (data/products.ts) when the cart is shown.

/** Most of one product that can be in the cart (same cap as the product page). */
export const MAX_QTY = 10;

export type CartLine = { slug: string; qty: number };

function clampQty(qty: number): number {
  const whole = Number.isFinite(qty) ? Math.floor(qty) : 1;
  return Math.min(MAX_QTY, Math.max(1, whole));
}

const store = createPersistentStore<readonly CartLine[]>({
  key: "bhumiblend:cart",
  empty: [],
  parse: (raw) => {
    if (!Array.isArray(raw)) return [];
    const seen = new Set<string>();
    const lines: CartLine[] = [];
    for (const item of raw) {
      if (typeof item !== "object" || item === null) continue;
      const { slug, qty } = item as Record<string, unknown>;
      if (typeof slug !== "string" || typeof qty !== "number" || seen.has(slug)) continue;
      seen.add(slug);
      lines.push({ slug, qty: clampQty(qty) });
    }
    return lines;
  },
});

/** Fired on `window` after every "add", for the toast (see CartToast). */
export const CART_ADDED_EVENT = "bhumiblend:cart-added";
export type CartAddedDetail = {
  slug: string;
  name: string;
  /** How many were actually added — 0 when the cart already held the maximum. */
  added: number;
};

/** Put `qty` more of a product in the cart (never above MAX_QTY in total). Stays on the current page. */
export function addToCart(product: { slug: string; name: string }, qty = 1) {
  let added = 0;
  store.update((lines) => {
    const existing = lines.find((line) => line.slug === product.slug);
    const before = existing?.qty ?? 0;
    const after = clampQty(before + qty);
    added = after - before;
    if (added <= 0) {
      added = 0;
      return lines;
    }
    return existing
      ? lines.map((line) => (line.slug === product.slug ? { ...line, qty: after } : line))
      : [...lines, { slug: product.slug, qty: after }];
  });
  window.dispatchEvent(
    new CustomEvent<CartAddedDetail>(CART_ADDED_EVENT, {
      detail: { slug: product.slug, name: product.name, added },
    }),
  );
}

/** Set a line's quantity (clamped to 1–MAX_QTY). */
export function setCartQuantity(slug: string, qty: number) {
  store.update((lines) => {
    const existing = lines.find((line) => line.slug === slug);
    if (!existing) return lines;
    const next = clampQty(qty);
    return next === existing.qty
      ? lines
      : lines.map((line) => (line.slug === slug ? { ...line, qty: next } : line));
  });
}

export function removeFromCart(slug: string) {
  store.update((lines) =>
    lines.some((line) => line.slug === slug) ? lines.filter((line) => line.slug !== slug) : lines,
  );
}

export function clearCart() {
  store.update((lines) => (lines.length > 0 ? [] : lines));
}

/** The cart lines, the total number of items (what the header badge shows) and a change counter. */
export function useCart() {
  const { value, version } = store.useStore();
  const count = value.reduce((total, line) => total + line.qty, 0);
  return { lines: value, count, version };
}
