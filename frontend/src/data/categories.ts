import {
  bodyCareProducts,
  comboProducts,
  hairCareProducts,
  skinCareProducts,
  type Product,
} from "@/data/products";

export type IngredientsSection = {
  eyebrow: string;
  heading: string;
  intro: string;
  items: { name: string; text: string; image: string }[];
  ctaLabel: string;
  ctaHref: string;
};

export type WhyChooseSection = {
  eyebrow: string;
  /** Heading = `heading` + a line break + `headingAccent` (set in gold). */
  heading: string;
  headingAccent: string;
  intro: string;
  items: { title: string; text: string; icon: "leaf" | "sprout" | "shield" | "sparkle" }[];
  ctaLabel: string;
  ctaHref: string;
};

export type Category = {
  /** The last part of the URL: /product-category/<slug>. */
  slug: string;
  /** Tab title and meta description. */
  metaTitle: string;
  metaDescription: string;
  /** Banner copy. */
  eyebrow: string;
  /** Heading = `heading` + " " + `headingAccent`; the accent is set in gold. */
  heading: string;
  headingAccent: string;
  intro: string;
  ctaLabel: string;
  /** Banner photo (file in /public) and its description. Empty = no photo: a plain cream banner. */
  bannerImage: string;
  bannerAlt: string;
  /** Where the photo sits inside the banner box, as an object-position value. */
  bannerFocus: string;
  /** Desktop layout: where the photo starts, as a percent of the banner width.
      0: the photo fills the whole banner under a cream veil over its left side.
      Above 0: the photo sits in the right (100 - n)% and fades into cream at
      its own left edge, for photos whose subject reaches the left or that are
      too small or too narrow to stretch across the banner. */
  bannerPhotoLeft: number;
  /** Let Next resize/re-encode the photo. Off for small JPEGs (served as-is);
      on for big files such as a PNG. */
  bannerOptimize?: boolean;
  /** Title above the product grid. */
  listHeading: string;
  products: Product[];
  /** "Ingredients & Benefits" section under the product grid. */
  ingredients?: IngredientsSection;
  /** "Why Choose Bhumi Blend" section under the product grid (and so under
      every page of the pagination, since it sits outside the grid). */
  whyChoose?: WhyChooseSection;
};

// The categories that have a page: hair, face (skin), body and combo, the four
// in the header menu.
export const categories: Category[] = [
  {
    slug: "hair",
    metaTitle: "Hair Care | Bhumi Blend Organics",
    metaDescription:
      "Restore strength, reduce hair fall and nourish your scalp with Bhumi Blend's plant-based Ayurvedic hair oil, shampoos, conditioner and rosemary water.",
    eyebrow: "Ayurvedic Hair Care",
    heading: "Stronger, Healthier Hair",
    headingAccent: "Naturally",
    intro:
      "Restore strength, reduce hair fall, and nourish your scalp with plant-based Ayurvedic formulations designed for long-term hair health.",
    ctaLabel: "Shop Hair Care",
    bannerImage: "/bhumihaircare.jpeg",
    bannerAlt:
      "A woman with long dark hair applying Ayurvedic hair oil to her scalp with a dropper, surrounded by coconut, amla, herbs and a stone mortar",
    bannerFocus: "62% 6%",
    bannerPhotoLeft: 0,
    listHeading: "Haircare Products",
    products: hairCareProducts,
    ingredients: {
      eyebrow: "Ingredients & Benefits",
      heading: "Rooted in Nature, Crafted for Healthy Hair",
      intro:
        "Our hair care collection is thoughtfully formulated with carefully selected ingredients inspired by Ayurvedic traditions to help nourish the scalp, strengthen strands, and support healthy-looking hair.",
      items: [
        {
          name: "Amla",
          text: "Traditionally valued for helping support stronger, fuller-looking hair and maintaining scalp health.",
          image: "/amla.webp",
        },
        {
          name: "Hibiscus",
          text: "Known in Ayurvedic care for helping promote smoothness and supporting soft, manageable hair.",
          image: "/hibiscus.webp",
        },
        {
          name: "Coconut Oil",
          text: "Helps nourish and condition the hair, supporting moisture retention and a naturally healthy shine.",
          image: "/c_oil.webp",
        },
        {
          name: "Rosemary",
          text: "Widely used in hair care to help support scalp vitality and promote a refreshed, revitalized feel.",
          image: "/rosemary.jpg",
        },
      ],
      ctaLabel: "Explore More Products",
      ctaHref: "/shop",
    },
  },
  {
    slug: "face",
    metaTitle: "Skin Care | Bhumi Blend Organics",
    metaDescription:
      "Support clear, glowing skin with Bhumi Blend's Ayurvedic anti-ageing cream, saffron gel, under eye cream, vitamin C serum, aloe vera gel and Gua Sha tool.",
    eyebrow: "Ayurvedic Skin Care",
    heading: "Radiant Skin with",
    headingAccent: "Natural Care",
    intro:
      "Support clear, glowing skin with time-tested Ayurvedic ingredients blended for modern skincare needs.",
    ctaLabel: "Shop Skin Care",
    // The same portrait as the third home banner slide. Its jar and face fill
    // the middle and right, so the photo sits on the right 60% of the banner.
    bannerImage: encodeURI("/Warm Skincare Beauty Portrait.png"),
    bannerAlt:
      "A woman holding a jar of Bhumi Blend Anti-Ageing Cream beside her face, a smear of cream on her cheek",
    bannerFocus: "70% 40%",
    bannerPhotoLeft: 40,
    bannerOptimize: true,
    listHeading: "Facecare Products",
    products: skinCareProducts,
    ingredients: {
      eyebrow: "Ingredients & Benefits",
      heading: "Powered by Nature’s Finest",
      intro:
        "Our skin care collection is crafted with carefully selected ingredients inspired by Ayurvedic rituals to help nourish, soothe, and brighten your skin.",
      items: [
        {
          name: "Aloe Vera",
          text: "Helps soothe and hydrate the skin while supporting a refreshed, balanced feel.",
          image: "/Aloe-Vera.jpg",
        },
        {
          name: "Saffron",
          text: "Traditionally valued for helping support a radiant, healthy-looking glow.",
          image: "/saffron.webp",
        },
        {
          name: "Vitamin C",
          text: "Helps revitalize dull-looking skin and supports a brighter, more refreshed appearance.",
          image: "/vitamin-c.jpg",
        },
        {
          name: "Herbal Botanicals",
          text: "Thoughtfully chosen plant-based ingredients designed for gentle, everyday skin care.",
          image: "/herbs-botanicals.webp",
        },
      ],
      ctaLabel: "Explore More Products",
      ctaHref: "/shop",
    },
  },
  {
    slug: "body",
    metaTitle: "Body Care | Bhumi Blend Organics",
    metaDescription:
      "Hydrate, soften and protect your skin with Bhumi Blend's almond butter body lotion and shea butter, Nalpamaram and sandalwood soaps.",
    eyebrow: "Ayurvedic Body Care",
    heading: "Deep Nourishment for",
    headingAccent: "Your Skin",
    intro:
      "Hydrate, soften, and protect your skin with rich botanical blends crafted to support daily skin health and long-lasting moisture.",
    ctaLabel: "Shop Body Care",
    // A small portrait (510x640) with a pale cream background, so it takes a
    // narrow slot on the right (about 40%) and fades into the page.
    bannerImage: "/body-510x640.jpg",
    bannerAlt:
      "A smiling woman smoothing white body lotion over her shoulder",
    bannerFocus: "50% 45%",
    bannerPhotoLeft: 60,
    listHeading: "Bodycare Products",
    products: bodyCareProducts,
    ingredients: {
      eyebrow: "Ingredients & Benefits",
      heading: "Nourishment Inspired by Nature",
      intro:
        "Our body care collection is crafted with carefully selected ingredients inspired by Ayurvedic traditions to help cleanse, nourish, and restore your skin’s natural balance.",
      items: [
        {
          name: "Turmeric",
          text: "Traditionally valued for helping support clearer, more radiant-looking skin.",
          image: "/Turmeric-powder.webp",
        },
        {
          name: "Neem",
          text: "Known for its purifying properties, helping support clean and balanced skin.",
          image: "/Neem.webp",
        },
        {
          name: "Shea Butter",
          text: "Provides rich hydration, helping support smooth, supple, and well-nourished skin.",
          image: "/shea.jpg",
        },
        {
          name: "Sandalwood",
          text: "Traditionally used to help soothe and refresh the skin while supporting an even-looking appearance.",
          image: "/sandalwood.webp",
        },
      ],
      ctaLabel: "Explore More Products",
      ctaHref: "/shop",
    },
  },
  {
    slug: "combo",
    metaTitle: "Combo Sets | Bhumi Blend Organics",
    metaDescription:
      "Complete Ayurvedic routines in curated bundles: skin care kits, soap sets and gift boxes from Bhumi Blend Organics, designed for visible results and better value.",
    eyebrow: "Complete Care Solutions",
    heading: "Your Daily Self-Care,",
    headingAccent: "Simplified",
    intro:
      "Experience the power of complete routines with thoughtfully curated bundles designed to deliver visible results and better value.",
    ctaLabel: "Shop Combos",
    // No banner image was named for this page, so it uses the range shot from
    // the home banner (1500x844): the products fill the middle of the frame,
    // so the photo takes the right 60% of the banner.
    bannerImage: encodeURI("/Bhumi Blend Organics Product Collection-100kb.jpeg"),
    bannerAlt:
      "The Bhumi Blend range: hair oil, shampoo, rosemary water, aloe vera and saffron gels, soaps, body lotion and creams around a gift box",
    bannerFocus: "50% 50%",
    bannerPhotoLeft: 40,
    listHeading: "Combo Products",
    products: comboProducts,
    whyChoose: {
      eyebrow: "Why Choose Bhumi Blend",
      heading: "Crafted with Purpose,",
      headingAccent: "Backed by Nature",
      intro:
        "At Bhumi Blend, every formulation is thoughtfully created using time-tested Ayurvedic wisdom and carefully selected natural ingredients to deliver safe, effective, and visible results.",
      items: [
        {
          title: "Rooted in Authentic Ayurvedic Principles",
          text: "Formulations inspired by time-tested Ayurvedic traditions, focusing on balance, natural healing, and holistic wellness.",
          icon: "leaf",
        },
        {
          title: "Made with High-Quality Plant-Based Ingredients",
          text: "Carefully crafted using premium natural ingredients known for their purity, effectiveness, and skin-friendly properties.",
          icon: "sprout",
        },
        {
          title: "Free from Harmful Chemicals",
          text: "Created without parabens, sulfates, or harsh additives to ensure gentle, safe, and toxin-free care.",
          icon: "shield",
        },
        {
          title: "Designed for Real, Visible Results",
          text: "Developed to deliver noticeable improvements with consistent use, supporting healthier skin and hair over time.",
          icon: "sparkle",
        },
      ],
      ctaLabel: "Explore More Products",
      ctaHref: "/shop",
    },
  },
];

export function getCategory(slug: string): Category | undefined {
  return categories.find((category) => category.slug === slug);
}

/**
 * The page of a category made in the admin, which has no hand-made design: a plain cream
 * banner with its name and description, then its products. (hair, face, body and combo keep
 * their own designs above.)
 */
export function categoryFromAdmin(entry: { slug: string; name: string; description?: string }): Category {
  const about = entry.description?.trim() ?? "";
  return {
    slug: entry.slug,
    metaTitle: `${entry.name} | Bhumi Blend Organics`,
    metaDescription: about || `Shop ${entry.name} from Bhumi Blend Organics.`,
    eyebrow: "Our Collection",
    heading: entry.name,
    headingAccent: "",
    intro: about,
    ctaLabel: `Shop ${entry.name}`,
    bannerImage: "",
    bannerAlt: "",
    bannerFocus: "50% 50%",
    bannerPhotoLeft: 0,
    listHeading: entry.name,
    products: [],
  };
}
