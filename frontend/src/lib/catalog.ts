import { cacheLife, cacheTag } from "next/cache";
import { contact as builtInContact } from "@/data/contact";
import type { ProductDetail } from "@/data/productDetails";
import type { Product } from "@/data/products";

// The shop's products, categories and contact details, read from the backend
// (backend/) — so what an admin edits in the admin panel is what the site shows.
//
// Every function here is cached, so pages stay fast and the backend isn't hit on
// every visit:
//   - an admin save makes the backend call /api/revalidate (see app/api/revalidate),
//     which drops the cached copy: the very next page load shows the change;
//   - and as a safety net each copy refreshes itself after a minute anyway
//     (cacheLife "minutes"), e.g. if that call can't get through.
//
// Server-side only (it runs when a page is built or rendered, never in the browser).
// The backend's address is NEXT_PUBLIC_API_URL (default http://localhost:4000).
// If the backend can't be reached, the page that needs the products fails: there is
// deliberately no second copy of the catalogue to quietly show out-of-date prices.

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/+$/, "");

/** GET one path of the backend's API. 404 → null; any other failure throws. */
async function load<T>(path: string): Promise<T | null> {
  const response = await fetch(`${API_URL}/api${path}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`The shop's backend answered ${response.status} for ${path}.`);
  return (await response.json()) as T;
}

/** Every page of a product list (the backend sends at most 100 at a time). */
async function allProducts(query: string): Promise<Product[]> {
  const products: Product[] = [];
  for (let page = 1; page <= 20; page++) {
    const result = await load<{ items: Product[]; pages: number }>(`/products?${query}&limit=100&page=${page}`);
    if (!result) break;
    products.push(...result.items);
    if (page >= result.pages) break;
  }
  return products;
}

/** Every product on sale, in the shop's order. Also what the cart, wishlist and checkout look products up in. */
export async function getCatalogue(): Promise<Product[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog");
  return allProducts("sort=default");
}

/** A row on the home page: "best-sellers" or "skin-care-essentials", in the order set in the admin. */
export async function getCollection(key: "best-sellers" | "skin-care-essentials"): Promise<Product[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog");
  return allProducts(`collection=${key}`);
}

/** The products of one category page (/product-category/<slug>), in that category's order. */
export async function getCategoryProducts(slug: string): Promise<Product[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog");
  return allProducts(`category=${encodeURIComponent(slug)}`);
}

type ApiProduct = Product & {
  sku?: string;
  categories: string[];
  details: Partial<ProductDetail> | null;
  related: Product[];
  bundle: { product: Product; quantity: number }[];
};

export type ProductPageData = {
  /** Name, prices, photos, stock — the same card the shop grid shows. */
  product: Product;
  /** Everything the product page shows below the buttons. */
  detail: ProductDetail;
  related: Product[];
  /** For a kit: the products it is made of, with how many of each. */
  bundle: { item: Product; quantity: number }[];
};

/** One product's page, or null when there is no such (visible) product. */
export async function getProductPage(slug: string): Promise<ProductPageData | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog");

  const data = await load<ApiProduct>(`/products/${encodeURIComponent(slug)}`);
  if (!data) return null;

  // Everything except the card's own fields is split off (the category slugs aren't shown on the page).
  const { sku, categories, details, related, bundle, ...product } = data;
  void categories;
  const content = details ?? {};
  // A product created in the admin without any page content still gets a working page.
  const gallery = content.gallery?.length
    ? content.gallery
    : [{ src: product.image, alt: product.name }, ...(product.hoverImage && product.hoverImage !== product.image ? [{ src: product.hoverImage, alt: "" }] : [])];

  const detail: ProductDetail = {
    categories: [],
    rating: { value: 0, count: 0 },
    whyChoose: [],
    description: [],
    ingredients: [],
    relatedSlugs: [],
    ...content,
    gallery,
    slug: product.slug,
    sku,
    weight: product.weight,
  };
  return { product, detail, related, bundle: bundle.map(({ product: item, quantity }) => ({ item, quantity })) };
}

type ApiSettings = {
  storeName: string;
  contactEmail: string;
  contactPhone: string;
  address: { line1: string; line2: string; city: string; state: string; pin: string; country: string };
};

/**
 * Contact details for the footer and the contact page: what the admin typed in
 * Settings, falling back to the built-in text (data/contact.ts) for anything left
 * blank — or if the backend can't be reached, since this isn't worth failing a page for.
 */
export async function getContact(): Promise<typeof builtInContact> {
  "use cache";
  cacheLife("minutes");
  cacheTag("settings");

  let settings: ApiSettings | null = null;
  try {
    settings = await load<ApiSettings>("/settings");
  } catch {
    return builtInContact;
  }
  if (!settings) return builtInContact;

  const phone = settings.contactPhone.trim();
  const digits = phone.replace(/\D/g, "");
  // wa.me wants digits only, with the country code; a bare 10-digit Indian number gets 91 in front.
  const whatsappDigits = digits.length === 10 ? `91${digits}` : digits;
  const { address } = settings;
  const addressLines =
    address.line1.trim() && address.city.trim()
      ? [address.line1.trim(), address.line2.trim(), `${address.city.trim()}${address.state ? `, ${address.state}` : ""}${address.pin ? ` ${address.pin}` : ""}`].filter(Boolean)
      : builtInContact.addressLines;

  return {
    ...builtInContact,
    email: settings.contactEmail.trim() || builtInContact.email,
    phoneLabel: phone || builtInContact.phoneLabel,
    phoneHref: phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : builtInContact.phoneHref,
    whatsappHref: phone && whatsappDigits ? `https://wa.me/${whatsappDigits}` : builtInContact.whatsappHref,
    addressLines,
  };
}
