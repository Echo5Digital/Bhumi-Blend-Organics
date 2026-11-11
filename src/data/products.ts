export type Product = {
  slug: string;
  name: string;
  /** Main image (file in /public). */
  image: string;
  /** Shown on hover (file in /public). */
  hoverImage: string;
  /** Current price in INR. */
  price: number;
  /** Original price in INR — only set when the product is on offer. */
  regularPrice?: number;
  /** Average star rating out of 5 — only set where the live site shows one. */
  rating?: number;
};

// The 8 Best Sellers, in display order. Names, prices and offers are the ones
// on the live bhumiblend.com.
export const bestSellers: Product[] = [
  {
    slug: "buy-pure-aloe-vera-gel",
    name: "Original Aloe Vera Gel",
    image: "/Aloevera-Gel-2_01.jpg",
    hoverImage: "/Aloevera-Gel-2_02-1.jpg",
    price: 250,
  },
  {
    slug: "best-ayurvedic-hair-oil",
    name: "Bhumi Blend Pure Ayurvedic Hair Oil",
    image: "/Hair-Oil-Organic.jpg",
    hoverImage: "/Hair-Oil-2_05-1.jpg",
    price: 399,
    regularPrice: 499,
  },
  {
    slug: "saffron-face-cream-for-glowing-skin",
    name: "Organic Saffron Gel",
    image: "/Sffron-Gel-2_01-1.jpg",
    hoverImage: "/Sffron-Gel-2_05-2.jpg",
    price: 599,
    regularPrice: 1200,
  },
  {
    slug: "ayurvedic-anti-aging-cream",
    name: "Anti Ageing Cream",
    image: "/Anti-ageing-Cream-4_01.jpg",
    hoverImage: "/Anti-ageing-Cream-4_02-1.jpg",
    price: 599,
    regularPrice: 1800,
  },
  {
    slug: "natural-face-serum-for-dark-spots-india",
    name: "Vitamin C Face Serum",
    image: "/face-serum-2_01.jpg",
    hoverImage: "/face-serum-2_03-1.jpg",
    price: 599,
    regularPrice: 1199,
  },
  {
    slug: "essential-skin-repair-range",
    name: "Essential Skin Repair Range",
    image: "/Essential-Skin-Repair-Range.webp",
    hoverImage: "/combo-1-feb-6.webp",
    price: 2000,
  },
  {
    slug: "ayurvedic-youth-revival-kit",
    name: "Ayurvedic Youth Revival Kit",
    image: "/Ayurvedic-Youth-Revival-Kit-new.webp",
    // Same picture as "combo4-feb-2 (1).jpg"; the clean filename avoids a URL
    // with spaces and brackets.
    hoverImage: "/combo4-feb-2.jpg",
    price: 1999,
  },
  {
    slug: "brightening-clarifying-skin-care-range",
    name: "Brightening & Clarifying Skin Care Range",
    image: "/Bhumi-Blend-Brightening-Clarifying-Skin-Care-Range.jpg",
    hoverImage: "/Bhumi-Blend-Brightening-Clarifying-Skin-Care-Range-2-500x669.jpg",
    price: 2000,
  },
];

// The Skin Care Essentials row, in display order. Names, prices and offers are
// the ones on the live bhumiblend.com; the 500px photos are the pre-cropped
// versions of the product shots. Slugs for the Gua Sha tool and the Under Eye
// Cream are placeholders until their product pages exist.
export const skinCareEssentials: Product[] = [
  {
    slug: "ayurvedic-anti-aging-cream",
    name: "Anti Ageing Cream",
    image: "/Anti-ageing-Cream-4_01-500x669.jpg",
    hoverImage: "/Anti-ageing-Cream-4_02-1-500x668.jpg",
    price: 599,
    regularPrice: 1800,
  },
  {
    slug: "gua-sha-face-tool",
    name: "Gua Sha Face Tool",
    image: "/Gua-Sha-Face-Tool-BB-500x669.jpg",
    hoverImage: "/Gua-Sha-2_02-500x669.jpg",
    price: 250,
    regularPrice: 300,
  },
  {
    slug: "saffron-face-cream-for-glowing-skin",
    name: "Organic Saffron Gel",
    image: "/Sffron-Gel-2_01-1-500x669.jpg",
    hoverImage: "/Sffron-Gel-2_05-2-500x668.jpg",
    price: 599,
    regularPrice: 1200,
  },
  {
    slug: "organic-under-eye-cream",
    name: "Organic Under Eye Cream",
    image: "/Under-Eye-Cream-3_01-1-500x669.jpg",
    hoverImage: "/Under-Eye-Cream-3_02-2-500x669.jpg",
    price: 599,
    regularPrice: 800,
  },
  {
    slug: "buy-pure-aloe-vera-gel",
    name: "Original Aloe Vera Gel",
    image: "/Aloevera-Gel-2_01-500x669.jpg",
    hoverImage: "/Aloevera-Gel-2_02-1-500x668.jpg",
    price: 250,
    rating: 5,
  },
  {
    slug: "natural-face-serum-for-dark-spots-india",
    name: "Vitamin C Face Serum",
    image: "/face-serum-2_01-500x669.jpg",
    hoverImage: "/face-serum-2_03-1-500x667.jpg",
    price: 599,
    regularPrice: 1199,
  },
];
