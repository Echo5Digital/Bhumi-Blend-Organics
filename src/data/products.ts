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

// The /shop page, in display order (all 3 pages of the live shop, 9 per
// page). Names and prices are the ones on the live bhumiblend.com/shop. Slugs are placeholders
// until the product pages exist. Where a "(1)" copy of a photo was supplied it
// is byte-identical to the clean-named file already in /public, so that one is
// used (no spaces or brackets in the URL).
export const shopProducts: Product[] = [
  {
    slug: "best-organic-body-lotion-for-dry-skin",
    name: "Almond Butter Hydrating Body Lotion",
    image: "/Body-Lotion-3_01-1.jpg",
    hoverImage: "/Body-Lotion-3_02-2.jpg",
    price: 699,
    regularPrice: 899,
  },
  {
    slug: "aloe-pure-shampoo",
    name: "Aloe Pure Shampoo",
    image: "/Aloe-Pure-Shampoo.webp",
    hoverImage: "/Aloe-pure-shampoo-4.webp",
    price: 599,
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
    slug: "ayurvedic-exfoliation-glow-kit",
    name: "Ayurvedic Exfoliation & Glow Kit",
    image: "/Ayurvedic-Exfoliation-Glow-Kit.jpg",
    // No second photo was supplied for this one.
    hoverImage: "/Ayurvedic-Exfoliation-Glow-Kit.jpg",
    price: 1048,
    regularPrice: 1698,
  },
  {
    slug: "ayurvedic-youth-revival-kit",
    name: "Ayurvedic Youth Revival Kit",
    image: "/Ayurvedic-Youth-Revival-Kit-new.webp",
    // The supplied hover file is identical to the main photo.
    hoverImage: "/Ayurvedic-Youth-Revival-Kit-new.webp",
    price: 1999,
  },
  {
    slug: "bhumi-blend-mens-combo",
    name: "Bhumi Blend Men’s Combo",
    image: "/mens-care-2_01.jpg",
    hoverImage: "/mens-care-2_02.jpg",
    price: 2999,
  },
  {
    slug: "bhumi-blend-organics-premium-combo-3-soap-set",
    name: "Bhumi Blend Organics Premium Soap Set of 3",
    image: "/3-Combo-Soap-Set.jpg",
    hoverImage: "/Soap-Combo-Box_02.jpg",
    price: 699,
  },
  {
    slug: "bhumi-blend-organics-premium-combo-6-soap-set",
    name: "Bhumi Blend Organics Premium Soap Set of 6",
    image: "/6-Combo-Soap-Set.jpg",
    // Identical to the Set of 3 hover photo (the supplied "(1)" copy).
    hoverImage: "/Soap-Combo-Box_02.jpg",
    price: 1349,
  },
  {
    slug: "bhumi-blend-premium-combo-box",
    name: "Bhumi Blend Premium Combo Box",
    image: "/woman-care-2_01.jpg",
    hoverImage: "/women-care-3_04-1.jpg",
    price: 4999,
  },
  // --- Page 2 of the live shop (items 10–18). ---
  {
    slug: "best-ayurvedic-hair-oil",
    name: "Bhumi Blend Pure Ayurvedic Hair Oil",
    image: "/Hair-Oil-Organic.jpg",
    hoverImage: "/Hair-Oil-2_05-1-500x669.jpg",
    price: 399,
    regularPrice: 499,
  },
  {
    slug: "bhumi-blend-starter-combo-box",
    name: "Bhumi Blend Starter Combo Box",
    image: "/woman-care-2_01.jpg",
    hoverImage: "/women-care-3_03-2-500x668.jpg",
    price: 1999,
  },
  {
    slug: "brightening-clarifying-skin-care-range",
    name: "Brightening & Clarifying Skin Care Range",
    image: "/Bhumi-Blend-Brightening-Clarifying-Skin-Care-Range-800x1070.jpg",
    hoverImage: "/Bhumi-Blend-Brightening-Clarifying-Skin-Care-Range-2-500x669.jpg",
    price: 2000,
  },
  {
    slug: "essential-skin-repair-range",
    name: "Essential Skin Repair Range",
    image: "/Essential-Skin-Repair-Range-500x669.webp",
    hoverImage: "/combo-1-feb-6-500x669.webp",
    price: 2000,
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
    slug: "luxury-shea-butter-soap",
    name: "Luxury Shea Butter Soap",
    image: "/shea-butter-soap-2_01-1-500x669.jpg",
    hoverImage: "/shea-butter-soap-2_02-3-500x668.jpg",
    price: 250,
    regularPrice: 289,
  },
  {
    slug: "ayurvedic-clarifying-soap",
    name: "Nalpamaram Soap",
    image: "/Naalpamaram-Soap-2_01-1-500x669.jpg",
    // Square (500×500) poster; the 3:4 tile crops a little off the sides.
    hoverImage: "/soap_poster-500x500.webp",
    price: 199,
    regularPrice: 249,
  },
  {
    slug: "ayurvedic-hair-tonic-for-hair-growth",
    name: "Organic Rosemary Water",
    image: "/carousel-poster_01-2-500x669.jpg",
    hoverImage: "/carousel-poster_02-1-500x669.jpg",
    price: 250,
    regularPrice: 350,
  },
  {
    slug: "saffron-face-cream-for-glowing-skin",
    name: "Organic Saffron Gel",
    image: "/Sffron-Gel-2_01-1-500x669.jpg",
    hoverImage: "/Sffron-Gel-2_05-2-500x668.jpg",
    price: 599,
    regularPrice: 1200,
  },
  // --- Page 3 of the live shop (items 19–25). ---
  {
    slug: "revive-under-eye-corrector",
    name: "Organic Under Eye Cream",
    image: "/Under-Eye-Cream-3_01-1.jpg",
    hoverImage: "/Under-Eye-Cream-3_02-2.jpg",
    price: 599,
    regularPrice: 800,
  },
  {
    slug: "buy-pure-aloe-vera-gel",
    name: "Original Aloe Vera Gel",
    image: "/Aloevera-Gel-2_01.jpg",
    hoverImage: "/Aloevera-Gel-2_02-1.jpg",
    price: 250,
  },
  {
    slug: "pure-leaf-aloe-conditioner",
    name: "Pure Leaf Aloe Conditioner",
    image: "/pure-leaf-aloe-conditioner.webp",
    hoverImage: "/conditioner-4.webp",
    price: 599,
    regularPrice: 699,
  },
  {
    slug: "best-ayurvedic-shampoo-for-hair-fall",
    name: "Root Vitality Ayurvedic Shampoo",
    image: "/anti_hairfall_shampoo.jpg",
    hoverImage: "/anti-hairfall-Shampoo_03.jpg",
    price: 499,
    regularPrice: 799,
  },
  {
    slug: "sacred-glow-sandalwood-soap",
    name: "Sandalwood Soap",
    image: "/Sandal-Soap-2_01-1.jpg",
    hoverImage: "/Sandal-Soap-2_02-2-1532x2048.jpg",
    price: 249,
  },
  {
    slug: "summer-essentials-luxury-kit",
    name: "Summer Essentials Luxury Kit",
    image: "/Summer-Essentials-Luxury-Kit-500x669.jpg",
    // Same photo on hover on the live site.
    hoverImage: "/Summer-Essentials-Luxury-Kit-500x669.jpg",
    price: 1099,
    regularPrice: 1799,
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

// The Combo category page (/product-category/combo): these ten shop products,
// in the order of the live bhumiblend.com combo page (nine on page 1, the
// Summer Essentials Luxury Kit alone on page 2). Taken from `shopProducts` so
// photos and prices are the shop's.
const comboSlugs = [
  "ayurvedic-exfoliation-glow-kit",
  "ayurvedic-youth-revival-kit",
  "bhumi-blend-mens-combo",
  "bhumi-blend-organics-premium-combo-3-soap-set",
  "bhumi-blend-organics-premium-combo-6-soap-set",
  "bhumi-blend-premium-combo-box",
  "bhumi-blend-starter-combo-box",
  "brightening-clarifying-skin-care-range",
  "essential-skin-repair-range",
  "summer-essentials-luxury-kit",
];

export const comboProducts: Product[] = comboSlugs.map((slug) => {
  const product = shopProducts.find((item) => item.slug === slug);
  if (!product) throw new Error(`Combo product "${slug}" is missing from shopProducts`);
  return product;
});

// The Hair Care category page (/product-category/hair), in display order.
// Names, prices and offers are the ones on the live bhumiblend.com category
// page. Every slug also exists in `shopProducts`, so cart and wishlist find
// these products there. The Aloe Pure Shampoo keeps the second photo it has on
// the shop page; the other four use the hover photos supplied for this page.
export const hairCareProducts: Product[] = [
  {
    slug: "aloe-pure-shampoo",
    name: "Aloe Pure Shampoo",
    image: "/Aloe-Pure-Shampoo.webp",
    hoverImage: "/Aloe-pure-shampoo-4.webp",
    price: 599,
  },
  {
    slug: "best-ayurvedic-hair-oil",
    name: "Bhumi Blend Pure Ayurvedic Hair Oil",
    image: "/Hair-Oil-Organic.jpg",
    hoverImage: "/Hair-Oil-2_05-1.jpg",
    price: 399,
    regularPrice: 499,
    rating: 4,
  },
  {
    slug: "ayurvedic-hair-tonic-for-hair-growth",
    name: "Organic Rosemary Water",
    image: "/carousel-poster_01-2-500x669.jpg",
    hoverImage: "/carousel-poster_02-1-500x669.jpg",
    price: 250,
    regularPrice: 350,
  },
  {
    slug: "pure-leaf-aloe-conditioner",
    name: "Pure Leaf Aloe Conditioner",
    image: "/pure-leaf-aloe-conditioner.webp",
    hoverImage: "/conditioner-4.webp",
    price: 599,
    regularPrice: 699,
  },
  {
    slug: "best-ayurvedic-shampoo-for-hair-fall",
    name: "Root Vitality Ayurvedic Shampoo",
    image: "/anti_hairfall_shampoo.jpg",
    hoverImage: "/anti-hairfall-Shampoo_03.jpg",
    price: 499,
    regularPrice: 799,
  },
];

// The Skin Care category page (/product-category/face), in display order.
// Names, prices, offers and the aloe gel's 5 stars are the ones on the live
// bhumiblend.com category page. Every slug also exists in `shopProducts`. The
// "(1)" copies of the hover photos that were supplied are byte-identical to the
// clean-named files used here (no spaces in the URL).
export const skinCareProducts: Product[] = [
  {
    slug: "ayurvedic-anti-aging-cream",
    name: "Anti Ageing Cream",
    image: "/Anti-ageing-Cream-4_01.jpg",
    hoverImage: "/Anti-ageing-Cream-4_02-1.jpg",
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
    image: "/Sffron-Gel-2_01-1.jpg",
    hoverImage: "/Sffron-Gel-2_05-2-500x668.jpg",
    price: 599,
    regularPrice: 1200,
  },
  {
    slug: "revive-under-eye-corrector",
    name: "Organic Under Eye Cream",
    image: "/Under-Eye-Cream-3_01-1.jpg",
    hoverImage: "/Under-Eye-Cream-3_02-2-500x669.jpg",
    price: 599,
    regularPrice: 800,
  },
  {
    slug: "buy-pure-aloe-vera-gel",
    name: "Original Aloe Vera Gel",
    image: "/Aloevera-Gel-2_01.jpg",
    hoverImage: "/Aloevera-Gel-2_02-1.jpg",
    price: 250,
    rating: 5,
  },
  {
    slug: "natural-face-serum-for-dark-spots-india",
    name: "Vitamin C Face Serum",
    image: "/face-serum-2_01.jpg",
    hoverImage: "/face-serum-2_03-1-500x667.jpg",
    price: 599,
    regularPrice: 1199,
  },
];

// The Body Care category page (/product-category/body), in display order.
// Names, prices and offers are the ones on the live bhumiblend.com category
// page; every slug also exists in `shopProducts`.
export const bodyCareProducts: Product[] = [
  {
    slug: "best-organic-body-lotion-for-dry-skin",
    name: "Almond Butter Hydrating Body Lotion",
    image: "/Body-Lotion-3_01-1.jpg",
    hoverImage: "/Body-Lotion-3_02-2.jpg",
    price: 699,
    regularPrice: 899,
  },
  {
    slug: "luxury-shea-butter-soap",
    name: "Luxury Shea Butter Soap",
    image: "/shea-butter-soap-2_01-1-500x669.jpg",
    hoverImage: "/shea-butter-soap-2_02-3-500x668.jpg",
    price: 250,
    regularPrice: 289,
  },
  {
    slug: "ayurvedic-clarifying-soap",
    name: "Nalpamaram Soap",
    image: "/Naalpamaram-Soap-2_01-1-500x669.jpg",
    // Square (500×500) poster; the 3:4 tile crops a little off the sides.
    hoverImage: "/soap_poster-500x500.webp",
    price: 199,
    regularPrice: 249,
  },
  {
    slug: "sacred-glow-sandalwood-soap",
    name: "Sandalwood Soap",
    image: "/Sandal-Soap-2_01-1.jpg",
    hoverImage: "/Sandal-Soap-2_02-2-1532x2048.jpg",
    price: 249,
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
    slug: "revive-under-eye-corrector",
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

// Every product that can carry a heart or an "Add to cart" button, once each.
// The three lists above overlap, so they are merged by slug; the shop list is
// last so its entry wins. The wishlist and the cart look products up here.
export const catalogue: Product[] = [
  ...new Map(
    [...skinCareEssentials, ...bestSellers, ...shopProducts].map((product) => [
      product.slug,
      product,
    ]),
  ).values(),
];
