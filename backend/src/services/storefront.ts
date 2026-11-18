import type { Env } from "../config/env.js";

// Tells the storefront "something you show has changed — refresh it".
//
// The storefront caches the catalogue so pages are fast. After an admin edits a
// product, a category or the settings (or an order changes a stock count), the
// backend calls the storefront's /api/revalidate with a shared secret, naming
// what changed: "catalog" (products, categories, stock) or "settings" (the
// store's contact details). The storefront then rebuilds those pages on the very
// next visit.
//
// Best effort, on purpose: it never makes an admin save wait or fail. If the
// storefront is down, or the two settings aren't set, pages simply refresh on
// their own timer (a minute) instead.

export type StorefrontTag = "catalog" | "settings";

export interface StorefrontNotifier {
  revalidate(tags: StorefrontTag[]): void;
}

export const silentNotifier: StorefrontNotifier = { revalidate() {} };

export function createStorefrontNotifier(env: Pick<Env, "STOREFRONT_URL" | "REVALIDATE_SECRET">): StorefrontNotifier {
  const base = env.STOREFRONT_URL?.replace(/\/+$/, "");
  const secret = env.REVALIDATE_SECRET;
  if (!base || !secret) return silentNotifier;

  return {
    revalidate(tags) {
      void fetch(`${base}/api/revalidate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
        body: JSON.stringify({ tags }),
        signal: AbortSignal.timeout(4000),
      })
        .then((response) => {
          if (!response.ok) console.warn(`The storefront refused the refresh request (HTTP ${response.status}). Check REVALIDATE_SECRET matches on both sides.`);
        })
        .catch((error: unknown) => {
          console.warn("Couldn't tell the storefront to refresh (pages will update on their own within a minute):", error instanceof Error ? error.message : error);
        });
    },
  };
}
