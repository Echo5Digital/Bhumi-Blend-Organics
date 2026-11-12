import { shopProducts, skinCareEssentials, type Product } from "@/data/products";

// Content for the /product/[slug] page, copied from the live bhumiblend.com
// product page — same wording, same order. Name, price and the first two photos
// come from products.ts (one source of truth).
// Only products that have an entry here get a page; any other slug is a 404.

export type ProductDetail = {
  slug: string;
  sku: string;
  categories: string[];
  /** Shown in bold under the price. */
  weight: string;
  tagline: string;
  /** The four short benefits, shown on one line separated by "|". */
  highlights: string[];
  /** The one-line pitch above the quantity / buy buttons. */
  summary: string;
  rating: { value: number; count: number };
  /** Product photo and hover photo first, then the four extra photos. */
  gallery: { src: string; alt: string }[];
  whyChoose: string[];
  /** The "Description" section. */
  description: string[];
  ingredients: { name: string; origin: string; image: string; text: string }[];
  /** Line shown under the Organic badge, above the five icons. */
  calmingLine: string;
  /** The five badges under the Organic line; images are 100×100 PNGs in /public. */
  trust: { image: string; label: string }[];
  /** Slugs from skinCareEssentials, shown under "Related products". */
  relatedSlugs: string[];
};

export const productDetails: ProductDetail[] = [
  {
    slug: "buy-pure-aloe-vera-gel",
    sku: "BB-AHC-ALG-100",
    categories: ["Face", "Skin"],
    weight: "100g",
    tagline: "Pure Hydration, Soothing Care",
    highlights: [
      "Nourishes skin",
      "Restores moisture",
      "Softens texture",
      "Calms irritation",
    ],
    summary: "Buy Pure Aloe Vera Gel for calm, healthy hydration",
    rating: { value: 5, count: 1 },
    gallery: [
      {
        src: "/Aloevera-Gel-2_01.jpg",
        alt: "Bhumi Blend Pure Aloe Healing Gel jar with fresh aloe leaves",
      },
      {
        src: "/Aloevera-Gel-2_02-1.jpg",
        alt: "Organic gel made with real aloe vera — 100% handpicked aloe vera",
      },
      {
        src: "/Aloevera-Gel-2_03-1.jpg",
        alt: "Deep hydration for skin, soothing and calming effect, natural glow enhancer, non-sticky and lightweight formula",
      },
      {
        src: "/Aloevera-Gel-2_04-1.jpg",
        alt: "Aromatherapy benefits of the subtle jasmine fragrance",
      },
      {
        src: "/Aloevera-Gel-2_05-1.jpg",
        alt: "Multipurpose organic gel for every need: skin moisturizer, hair care solution, makeup base, after-shave care",
      },
      {
        src: "/Aloevera-Gel-2_06-1.jpg",
        alt: "One gel, endless benefits — perfect for your hair and skin",
      },
    ],
    whyChoose: [
      "Inspired by Ayurvedic traditions",
      "Made with plant-based ingredients",
      "Gentle for daily use",
      "Crafted for real results",
    ],
    description: [
      "Experience the perfect blend of nature and luxury with Bhumi Blend Pure Aloe Vera Gel with Jasmine. Unlike ordinary aloe vera gels that are primarily made with gel bases and artificial additives, our formulation is crafted using real aloe vera and infused with the delicate essence of jasmine to provide a truly refreshing skincare experience.",
      "Aloe vera is renowned for its soothing, hydrating, and nourishing properties, helping to keep the skin soft, refreshed, and healthy-looking. The addition of jasmine elevates the formula with its naturally uplifting aroma and skin-loving benefits, making every application feel like a rejuvenating self-care ritual.",
      "This lightweight, fast-absorbing gel delivers deep hydration without leaving a sticky residue, making it suitable for daily use on both skin and hair. Whether used as a moisturizer, after-sun care treatment, soothing gel, or hair nourishment solution, Bhumi Blend Pure Aloe Vera Gel with Jasmine provides versatile care inspired by nature.",
    ],
    ingredients: [
      {
        name: "Aloe Vera",
        origin: "Thar Desert Farms",
        image: "/Aloe-Vera.jpg",
        text: "Known for its natural ability to soothe and hydrate, aloe vera is rich in vitamins, minerals, and antioxidants that help calm irritated skin, reduce redness, and promote a fresh, healthy glow. It is ideal for sunburns, skin inflammation, and restoring skin hydration.",
      },
      {
        name: "Jasmine Oil",
        origin: "Southern India",
        image: "/Jasmine-Oil.jpg",
        text: "This fragrant essential oil is known for its moisturizing and anti-inflammatory properties. It helps to nourish and revitalize the skin, while also imparting a calming, aromatic scent that elevates your skincare experience. Jasmine oil balances and softens the skin.",
      },
    ],
    calmingLine:
      "Hydrate, soothe, and restore with the calming power of 100% pure aloe vera",
    trust: [
      { image: "/1.png", label: "100% Natural Ingredients" },
      { image: "/2 (1).png", label: "Organically Cultivated" },
      { image: "/3 (1).png", label: "No Artificial Additives" },
      { image: "/4 (1).png", label: "Cruelty-Free" },
      { image: "/5.png", label: "Ayurvedic Formulation" },
    ],
    relatedSlugs: [
      "saffron-face-cream-for-glowing-skin",
      "natural-face-serum-for-dark-spots-india",
      "ayurvedic-anti-aging-cream",
      "gua-sha-face-tool",
      "organic-under-eye-cream",
    ],
  },
];

export function getProductDetail(slug: string): ProductDetail | undefined {
  return productDetails.find((detail) => detail.slug === slug);
}

/** The catalogue entry (name, price, offer) for a slug. */
export function getCatalogueProduct(slug: string): Product | undefined {
  return shopProducts.find((product) => product.slug === slug);
}

export function getRelatedProducts(detail: ProductDetail): Product[] {
  return detail.relatedSlugs
    .map((slug) => skinCareEssentials.find((product) => product.slug === slug))
    .filter((product): product is Product => product !== undefined);
}
