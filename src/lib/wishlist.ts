"use client";

import { createPersistentStore } from "@/lib/persistent-store";

// The wishlist: the saved product slugs, oldest first, kept in localStorage.
// Every heart button, the header badge and the /wishlist page read this one
// store, so they always agree.

const store = createPersistentStore<readonly string[]>({
  key: "bhumiblend:wishlist",
  empty: [],
  parse: (raw) =>
    Array.isArray(raw)
      ? [...new Set(raw.filter((item): item is string => typeof item === "string"))]
      : [],
});

export function toggleWishlist(slug: string) {
  store.update((slugs) =>
    slugs.includes(slug) ? slugs.filter((saved) => saved !== slug) : [...slugs, slug],
  );
}

export function removeFromWishlist(slug: string) {
  store.update((slugs) =>
    slugs.includes(slug) ? slugs.filter((saved) => saved !== slug) : slugs,
  );
}

/** The whole wishlist, for the header badge and the wishlist page. */
export function useWishlist() {
  const { value, version } = store.useStore();
  return { slugs: value, version };
}

/** Whether one product is saved. Re-renders only when that answer changes. */
export function useIsWishlisted(slug: string): boolean {
  return store.useSelector((slugs) => slugs.includes(slug));
}
