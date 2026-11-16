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
  /** Gold italic line under the size; left out when the live page has none. */
  tagline?: string;
  /** The four short benefits, shown on one line separated by "|" (optional). */
  highlights?: string[];
  /** The one-line pitch above the quantity / buy buttons. */
  summary: string;
  rating: { value: number; count: number };
  /** Product photo and hover photo first, then the four extra photos. */
  gallery: { src: string; alt: string }[];
  whyChoose: string[];
  /** The "Description" section. */
  description: string[];
  /** Optional "What's inside" heading shown above the ingredient cards. */
  ingredientsHeading?: { eyebrow: string; title: string };
  /** `origin` is shown as "Name (origin)"; `tag` instead gives a numbered
      label above the name ("01  Kerala Cultivation"). Use one or the other. */
  ingredients: {
    name: string;
    origin?: string;
    tag?: string;
    image: string;
    text: string;
  }[];
  /** Line shown under the Organic badge, above the five icons. */
  calmingLine: string;
  /** The five badges under the Organic line; images are 100×100 PNGs in /public. */
  trust: { image: string; label: string }[];
  /** Optional "How to use" steps, shown after the description. */
  usage?: {
    eyebrow: string;
    title: string;
    steps: { label: string; text: string }[];
    /** A highlighted tip under the steps. */
    tip?: string;
    /** A "who is it for" checklist under the steps. */
    suitableFor?: { title: string; intro: string; points: string[] };
  };
  /** Optional FAQ, shown after the usage steps. */
  faqs?: { question: string; answer: string }[];
  /** Slugs shown under "Related products" (skinCareEssentials first, then the shop list). */
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
  {
    slug: "best-organic-body-lotion-for-dry-skin",
    sku: "BB-BBC-NABHBL-450",
    categories: ["Body"],
    weight: "450ml",
    tagline: "Nourish, Hydrate, Glow – Naturally",
    highlights: [
      "Intense Moisturization",
      "Restores Dry Skin",
      "Silky Smooth Feel",
      "All-Day Comfort",
    ],
    summary: "Experience all day softness with our Best Organic Body Lotion For Dry Skin",
    // No reviews yet on the live site (the "Reviews (0)" tab).
    rating: { value: 0, count: 0 },
    gallery: [
      {
        src: "/Body-Lotion-3_01-1.jpg",
        alt: "Bhumi Blend Nourish + Almond Butter Hydrating Body Lotion bottle surrounded by almonds and a splash of almond milk",
      },
      {
        src: "/Body-Lotion-3_02-2.jpg",
        alt: "Almond Butter Hydrating Body Lotion product photo",
      },
      {
        src: "/Body-Lotion-3_03-2.jpg",
        alt: "A smiling woman lying among white daisies: developed after years of meticulous research by Ayurvedic experts, in harmony with nature's wisdom and scientific innovation",
      },
      {
        src: "/Body-Lotion-3_04-2.jpg",
        alt: "A luxurious blend of rich almond, velvety vanilla and nourishing shea butter",
      },
      {
        src: "/Body-Lotion-3_05-2.jpg",
        alt: "Made with 100% organic, natural ingredients, ensuring gentle care for your skin: almond, shea butter and vanilla",
      },
      {
        src: "/Body-Lotion-3_06-2.jpg",
        alt: "Our goodness promises: made safe, cruelty-free, best of nature and plastic positive",
      },
    ],
    whyChoose: [
      "Inspired by Ayurvedic traditions",
      "Made with plant-based ingredients",
      "Gentle for daily use",
      "Crafted for real results",
    ],
    description: [
      "Give your skin the nourishment it deserves with Bhumi Blend Organic Body Lotion for Dry Skin. Specially formulated to provide long-lasting hydration and daily care, this rich yet lightweight body lotion helps keep the skin feeling soft, smooth, and comfortably moisturized throughout the day.",
      "Dry skin can often feel rough, tight, and lacking in moisture due to environmental factors, weather changes, and everyday exposure to dryness. Bhumi Blend Organic Body Lotion is designed to replenish moisture and support the skin’s natural softness while helping maintain a healthy-looking appearance. The fast-absorbing formula spreads easily across the skin without leaving a heavy or greasy residue.",
      "Crafted with carefully selected ingredients inspired by nature, this body lotion is suitable for everyday use and helps provide the nourishment needed to keep skin feeling refreshed and hydrated. Whether used after a shower or as part of your daily skincare routine, it helps leave your skin feeling smooth, supple, and revitalized.",
    ],
    // Both photos are 228×152, the size the ingredient cards show them at.
    ingredients: [
      {
        name: "Almond Oil",
        origin: "California Almonds",
        image: "/Almond-Oil.jpg",
        text: "Rich in vitamin E and essential fatty acids, almond oil deeply nourishes and hydrates the skin. It helps to reduce dryness, soften rough patches, and promote a smooth, even texture, while its mild scent adds a delicate, calming touch to your skincare routine.",
      },
      {
        name: "Shea Butter",
        origin: "African Shea Trees",
        image: "/Shea-Butter-.jpg",
        text: "Known for its deep moisturizing properties, shea butter helps to repair dry skin, providing intense hydration and promoting skin’s softness and elasticity. It leaves your skin feeling luxuriously smooth and hydrated all day long, while also enhancing the skin’s natural glow.",
      },
    ],
    calmingLine:
      "Nourish and pamper your skin with the sweet essence of almonds and vanilla, 100% pure.",
    trust: [
      { image: "/1.png", label: "100% Natural Ingredients" },
      { image: "/2 (1).png", label: "Organically Cultivated" },
      { image: "/3 (1).png", label: "No Artificial Additives" },
      { image: "/4 (1).png", label: "Cruelty-Free" },
      { image: "/5.png", label: "Ayurvedic Formulation" },
    ],
    usage: {
      eyebrow: "Bhumi Blend · Organic Body Lotion",
      title: "How to use",
      steps: [
        { label: "Cleanse", text: "Cleanse your skin and pat dry." },
        { label: "Take", text: "Take an adequate amount of Bhumi Blend Organic Body Lotion." },
        {
          label: "Apply",
          text: "Apply evenly over the body, focusing on dry areas such as elbows, knees, hands, and legs.",
        },
        { label: "Massage", text: "Massage gently until fully absorbed." },
        { label: "Frequency", text: "Use daily or whenever your skin needs extra hydration." },
      ],
    },
    faqs: [
      {
        question: "What is Bhumi Blend Organic Body Lotion used for?",
        answer:
          "This body lotion is designed to help hydrate, nourish, and soften dry skin while supporting a healthy and moisturized appearance.",
      },
      {
        question: "Can I use this body lotion every day?",
        answer:
          "Yes. The lotion is suitable for daily use and can be applied after bathing or whenever your skin needs extra moisture.",
      },
      {
        question: "Is this lotion suitable for very dry skin?",
        answer:
          "Yes. It is specially formulated for dry skin and helps provide long-lasting hydration and nourishment.",
      },
      {
        question: "Does the lotion feel greasy on the skin?",
        answer:
          "No. The lightweight formula absorbs easily into the skin, leaving it feeling soft and comfortable without a heavy or greasy residue.",
      },
      {
        question: "Can both men and women use this body lotion?",
        answer:
          "Absolutely. Bhumi Blend Organic Body Lotion for Dry Skin is suitable for both men and women looking for effective daily moisturization and skin care.",
      },
    ],
    relatedSlugs: ["sandalwood-soap", "luxury-shea-butter-soap", "nalpamaram-soap"],
  },
  {
    // Same slug the shop, the hair care page and the cards already used.
    slug: "aloe-pure-shampoo",
    sku: "BB-ALOE-SHAM-200",
    categories: ["Hair", "All Products"],
    weight: "200ml",
    summary:
      "Cleanse and strengthen your hair with the power of pure Aloe, 100% plant-based and crafted for healthy scalp and lasting shine.",
    // No reviews yet on the live site (the "Reviews (0)" tab).
    rating: { value: 0, count: 0 },
    // The two photos from the shop first, then the seven extra ones in the
    // order they were supplied. The photo with the 260ml label (…-10) is a
    // supplied marketing image; the product is 200ml.
    gallery: [
      {
        src: "/Aloe-Pure-Shampoo.webp",
        alt: "Bhumi Blend Aloe Pure Shampoo 200ml bottle with fresh aloe vera leaves and slices",
      },
      {
        src: "/Aloe-pure-shampoo-4.webp",
        alt: "Benefits backed by science: strengthens weak strands, improves hair density, reduces hair breakage and supports scalp health",
      },
      {
        src: "/Aloe-pure-shampoo-3.webp",
        alt: "Real people, real results: up to 100% dandruff reduction, shown with before and after close-ups of a scalp",
      },
      {
        src: "/Aloe-pure-shampoo-2.webp",
        alt: "Aloe Pure Shampoo bottle: reduces visible flakes from the first wash, dermatologically tested",
      },
      {
        src: "/Aloe-pure-shampoo-1.webp",
        alt: "Aloe Pure Shampoo bottle beside a mound of foam: up to 100% dandruff reduction",
      },
      {
        src: "/Aloe-pure-shampoo-7-800x1068.webp",
        alt: "Who is this shampoo for? Dry to normal hair, sensitive or easily irritated scalps, plant-based hair care users, safe for daily or frequent use",
      },
      {
        src: "/Aloe-pure-shampoo-8.webp",
        alt: "Real people, real results: 96% of users observed less hairfall within 2 weeks of usage, with before and after photos",
      },
      {
        src: "/Aloe-pure-shampoo-10.webp",
        alt: "Powered by clean, plant-based ingredients: aloe extract, aqua, SCI and CAPB, glycerine, lavender essential oil and basil extract",
      },
      {
        src: "/Aloe-pure-shampoo-9.webp",
        alt: "Rooted in aloe, guided by Ayurveda: a gentle aloe-based shampoo for everyday hair and scalp balance",
      },
    ],
    whyChoose: [
      "Inspired by Ayurvedic traditions",
      "Made with plant-based ingredients",
      "Gentle for daily use",
      "Crafted for real results",
    ],
    description: [
      "Discover the power of nature-inspired hair care with Bhumi Blend Aloe Pure Shampoo, a gentle yet effective cleansing formula designed to nourish your scalp and leave your hair feeling clean, soft, and refreshed. Enriched with the goodness of Aloe Vera, Lavender, Tulsi (Basil), and Glycerine, this shampoo helps maintain the natural balance of your hair while providing essential hydration and care.",
      "Unlike harsh shampoos that can strip away natural oils, Aloe Pure Shampoo cleanses gently while supporting scalp comfort and healthy-looking hair. Its sulphate-free formula helps remove dirt, excess oil, and buildup without leaving the hair feeling dry or weighed down. The result is hair that feels softer, smoother, and more manageable after every wash.",
      "Inspired by traditional herbal hair care wisdom and crafted for modern lifestyles, Bhumi Blend Aloe Pure Shampoo is suitable for everyday use and works well for all hair types, including dry, damaged, and chemically treated hair. Whether you’re looking to maintain scalp health, improve hair manageability, or simply enjoy a cleaner hair care routine, Aloe Pure Shampoo offers gentle care with every wash.",
    ],
    ingredientsHeading: { eyebrow: "What’s inside", title: "Key ingredients" },
    // Aloe-Vera, Lavender-Oil and basil are 228×152; the glycerine photo is
    // 1600×1066 and is resized by Next.
    ingredients: [
      {
        name: "Aloe Extract",
        tag: "Kerala Cultivation",
        image: "/Aloe-Vera.jpg",
        text: "Rich in vitamins, enzymes, and amino acids, aloe deeply hydrates the scalp, reduces dryness, and supports stronger hair growth. Scientifically recognized for its soothing and conditioning properties, it helps restore softness and shine.",
      },
      {
        name: "Lavender Essential Oil",
        tag: "Essential Oil",
        image: "/Lavender-Oil.jpg",
        text: "Known for its calming and balancing properties, lavender essential oil soothes the scalp, helps reduce irritation, and leaves hair with a delicate, refreshing natural fragrance after every wash.",
      },
      {
        name: "Basil (Tulsi)",
        tag: "Ayurvedic Herb",
        image: "/basil.jpg",
        text: "A revered Ayurvedic herb known for strengthening hair roots and supporting scalp health. Basil helps reduce excess oil buildup and environmental stress impact.",
      },
      {
        name: "Glycerine",
        tag: "Natural Humectant",
        image: "/closeup-shot-glass-dish-with-yellow-liquid-dropper-lab-scaled.jpg",
        text: "A natural humectant that attracts and locks in moisture, keeping hair smooth, manageable, and less prone to frizz.",
      },
    ],
    calmingLine:
      "Cleanse and strengthen your hair with the power of pure Aloe, 100% plant-based and crafted for healthy scalp and lasting shine",
    trust: [
      { image: "/1.png", label: "100% Natural Ingredients" },
      { image: "/2 (1).png", label: "Organically Cultivated" },
      { image: "/3 (1).png", label: "No Artificial Additives" },
      { image: "/4 (1).png", label: "Cruelty-Free" },
      { image: "/5.png", label: "Ayurvedic Formulation" },
    ],
    usage: {
      eyebrow: "Bhumi Blend · Aloe Pure Shampoo",
      title: "How to use",
      steps: [
        { label: "Wet", text: "Wet your hair thoroughly with water." },
        {
          label: "Take",
          text: "Take an adequate amount of Bhumi Blend Aloe Pure Shampoo into your palms.",
        },
        { label: "Apply", text: "Apply to the scalp and hair." },
        {
          label: "Massage",
          text: "Gently massage using your fingertips to create a lather. Work the shampoo through the lengths of your hair.",
        },
        { label: "Rinse", text: "Rinse thoroughly with water. Repeat if necessary." },
        {
          label: "Follow up",
          text: "Follow with a conditioner or hair serum for added nourishment.",
        },
      ],
      tip: "For best results, use regularly as part of your hair care routine.",
      suitableFor: {
        title: "Who is this shampoo suitable for?",
        intro:
          "Bhumi Blend Aloe Pure Shampoo is ideal for individuals looking for gentle, everyday hair cleansing and scalp care.",
        points: [
          "Men and women of all ages",
          "All hair types",
          "Dry, frizzy, or dull hair",
          "Chemically treated or colored hair",
          "Individuals looking for sulphate-free hair care",
          "Those seeking gentle daily cleansing",
        ],
      },
    },
    // No FAQ text was supplied yet, so no `faqs` (the FAQ tab only appears
    // for products that have them).
    relatedSlugs: [
      "essential-skin-repair-range",
      "ayurvedic-youth-revival-kit",
      "pure-leaf-aloe-conditioner",
      "premium-soap-set-of-6",
      "premium-soap-set-of-3",
      "summer-essentials-luxury-kit",
      "organic-rosemary-water",
      "best-ayurvedic-hair-oil",
      "root-vitality-ayurvedic-shampoo",
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
  // The skin care row has the pre-cropped 500px photos; products that are not
  // in it (soaps, for example) come from the shop list.
  return detail.relatedSlugs
    .map(
      (slug) =>
        skinCareEssentials.find((product) => product.slug === slug) ??
        shopProducts.find((product) => product.slug === slug),
    )
    .filter((product): product is Product => product !== undefined);
}
