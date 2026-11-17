import { shopProducts, skinCareEssentials, type Product } from "@/data/products";

// Content for the /product/[slug] page, copied from the live bhumiblend.com
// product page — same wording, same order. Name, price and the first two photos
// come from products.ts (one source of truth).
// Only products that have an entry here get a page; any other slug is a 404.

export type ProductDetail = {
  slug: string;
  /** Shown in the small print under the page; left out when the live page has none. */
  sku?: string;
  categories: string[];
  /** Shown in bold under the price; left out when the live page has none. */
  weight?: string;
  /** Gold italic line under the size; left out when the live page has none. */
  tagline?: string;
  /** The four short benefits, shown on one line separated by "|" (optional). */
  highlights?: string[];
  /** A free gift, shown as a small gold line under the highlights (optional). */
  freebie?: string;
  /** A highlighted offer box, above the pitch by default (or under it with `afterSummary`).
      `code`, when set, is a coupon picked out inside `detail`. */
  offer?: { headline: string; detail: string; code?: string; afterSummary?: boolean };
  /** The one-line pitch above the quantity / buy buttons. */
  summary: string;
  /** For a kit: the products it is made of (from the catalogue), shown under the pitch. */
  bundle?: { slug: string; quantity: number }[];
  rating: { value: number; count: number };
  /** Product photo and hover photo first, then the four extra photos. */
  gallery: { src: string; alt: string }[];
  whyChoose: string[];
  /** The "Description" section. */
  description: string[];
  /** A small heading line above the description text (optional). */
  descriptionHeading?: string;
  /** A wide photo shown under the description text (optional). */
  descriptionImage?: { src: string; alt: string };
  /** A checklist of key benefits after the description (optional). */
  keyBenefits?: { title: string; points: string[] };
  /** A short statement card after the description (optional). */
  philosophy?: { title: string; paragraphs: string[] };
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
  calmingLine?: string;
  /** The five badges under the Organic line; images are 100×100 PNGs in /public. */
  trust?: { image: string; label: string }[];
  /** Optional "How to use" steps, shown after the description. */
  usage?: {
    eyebrow: string;
    title: string;
    steps: { label: string; text: string }[];
    /** A highlighted tip under the steps. */
    tip?: string;
    /** Its small heading; "Tip" when not set. */
    tipLabel?: string;
    /** A short guide to each product, shown under the steps (optional). */
    guide?: { title: string; items: { name: string; text: string }[] };
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
    faqs: [
      {
        question: "What makes Aloe Pure Shampoo different from regular shampoos?",
        answer:
          "Aloe Pure Shampoo is formulated with Aloe Vera, Lavender, Tulsi, and Glycerine and is free from sulphates, helping cleanse the hair gently without stripping away natural moisture.",
      },
      {
        question: "Is this shampoo suitable for daily use?",
        answer:
          "Yes. The gentle formula is designed for regular use and is suitable for individuals who wash their hair frequently.",
      },
      {
        question: "Can I use Aloe Pure Shampoo on chemically treated or colored hair?",
        answer:
          "Yes. The mild cleansing formula makes it suitable for chemically treated and color-treated hair.",
      },
      {
        question: "Does this shampoo contain sulphates?",
        answer:
          "No. Bhumi Blend Aloe Pure Shampoo is a sulphate-free formula designed to cleanse while helping maintain the hair's natural balance.",
      },
      {
        question: "Is this shampoo suitable for all hair types?",
        answer:
          "Yes. It is suitable for all hair types, including straight, wavy, curly, dry, oily, and normal hair.",
      },
    ],
    relatedSlugs: [
      "essential-skin-repair-range",
      "ayurvedic-youth-revival-kit",
      "pure-leaf-aloe-conditioner",
      "bhumi-blend-organics-premium-combo-6-soap-set",
      "bhumi-blend-organics-premium-combo-3-soap-set",
      "summer-essentials-luxury-kit",
      "organic-rosemary-water",
      "best-ayurvedic-hair-oil",
      "root-vitality-ayurvedic-shampoo",
      "organic-under-eye-cream",
    ],
  },
  {
    // Same slug the shop, the home page and the skin care cards already used.
    slug: "ayurvedic-anti-aging-cream",
    sku: "BB-SKC-TRC-100",
    categories: ["Face", "Skin"],
    weight: "100g",
    tagline: "Restore, rejuvenate, and glow naturally",
    highlights: ["Fights wrinkles", "Enhances elasticity", "Improves firmness"],
    freebie: "Free Gua sha",
    summary: "Revive your face with our powerful Ayurvedic Anti-Aging Cream",
    // No reviews yet on the live site (the "Reviews (0)" tab).
    rating: { value: 0, count: 0 },
    // The two photos from the shop first, then the four extra ones.
    gallery: [
      {
        src: "/Anti-ageing-Cream-4_01.jpg",
        alt: "Bhumi Blend Anti-Ageing Cream 100g jar with lavender, shea butter and red sandalwood",
      },
      {
        src: "/Anti-ageing-Cream-4_02-1.jpg",
        alt: "A man applying Anti-Ageing Cream: reduces fine lines and wrinkles, repairs damaged skin, increases collagen, firms and tightens the skin",
      },
      {
        src: "/Anti-ageing-Cream-4_03-1-800x1070.jpg",
        alt: "Experience timeless beauty with our premium original Gua Sha, gifted exclusively to enhance your skincare routine: Anti-Ageing Cream jar with a drop of golden oil",
      },
      {
        src: "/Anti-ageing-Cream-4_04-1.jpg",
        alt: "How to use your Timeless Renewal Cream: cleanse, moisturize, then repair with the gua sha tool",
      },
      {
        src: "/Anti-ageing-Cream-4_05-1.jpg",
        alt: "Before and after close-ups of a woman’s eye and cheek showing smoother-looking skin",
      },
      {
        src: "/Anti-ageing-Cream-4_06-1.jpg",
        alt: "Ingredients: wheatgerm oil, shea butter, lavender oil, sesame oil and red sandal, shown with the Anti-Ageing Cream jar, red sandalwood and shea butter",
      },
    ],
    whyChoose: [
      "Inspired by Ayurvedic traditions",
      "Made with plant-based ingredients",
      "Gentle for daily use",
      "Crafted for real results",
    ],
    description: [
      "Rediscover the beauty of naturally youthful-looking skin with Bhumi Blend Ayurvedic Anti-Aging Cream. Expertly crafted using the wisdom of Ayurveda and the goodness of nature-inspired ingredients, this nourishing cream is designed to support skin hydration, improve softness, and help maintain a healthy, radiant complexion.",
      "As we age, the skin can gradually lose moisture and elasticity, making it appear dull, dry, and tired. Bhumi Blend Ayurvedic Anti-Aging Cream helps provide essential nourishment and hydration to support smoother, more supple-looking skin. Its lightweight formula absorbs easily, delivering lasting comfort without feeling heavy or greasy. Whether you are beginning your anti-aging skincare journey or looking for a gentle daily moisturizer that supports mature skin, Bhumi Blend Ayurvedic Anti-Aging Cream offers a balanced approach to skincare inspired by traditional Ayurvedic wellness principles.",
    ],
    // All six photos are 228×152, the size the ingredient cards show them at.
    ingredients: [
      {
        name: "Wheatgerm Oil – The Collagen Booster",
        origin: "Palakkad Plains",
        image: "/Wheatgerm-Oil.jpg",
        text: "Extracted from nutrient-rich wheat grains cultivated in the fertile Palakkad plains, Wheatgerm Oil is packed with Vitamin E, omega fatty acids, and antioxidants. This powerhouse ingredient deeply nourishes the skin, boosts collagen production, and reduces fine lines, making it an essential for youthful, radiant skin.",
      },
      {
        name: "Shea Butter – The Deep Hydrator",
        origin: "African-Origin, Ethically Sourced",
        image: "/Shea-Butter-.jpg",
        text: "Sustainably sourced from wild-grown shea nuts, our Shea Butter is an intensely moisturizing and skin-softening ingredient. Rich in triglycerides and essential fatty acids, it smooths wrinkles, improves elasticity, and protects against environmental stressors, ensuring long-lasting hydration and a supple complexion.",
      },
      {
        name: "Lavender Oil – The Soothing Rejuvenator",
        origin: "Munnar Highlands",
        image: "/Lavender-Oil.jpg",
        text: "Hand-harvested from the cool, misty slopes of Munnar, our pure Lavender Oil is renowned for its calming, anti-inflammatory, and cell-regenerating properties. Unlike synthetic fragrances used in commercial skincare, our therapeutic-grade lavender oil relaxes the skin, reduces stress-induced aging, and enhances a youthful glow.",
      },
      {
        name: "Sesame Oil – The Ayurvedic Skin Strengthener",
        origin: "Kumarakom Fields",
        image: "/Sesame-Oil.jpg",
        text: "Cold-pressed from the finest sesame seeds grown in the rich soils of Kumarakom, Sesame Oil is a time-tested Ayurvedic elixir. Packed with linoleic acid, antioxidants, and minerals, it deeply penetrates the skin, improves elasticity, and combats oxidative stress, making it an ideal base for anti-ageing treatments.",
      },
      {
        name: "Rubia Cordifolia – The Skin Revitalizer",
        origin: "Wayanad Highlands",
        image: "/Rubia.jpg",
        text: "Wildcrafted from the mineral-rich hills of Wayanad, Rubia Cordifolia (Indian Madder) is a potent skin-rejuvenating herb. Used in Ayurveda for centuries, it enhances blood circulation, reduces pigmentation, and promotes an even-toned, youthful complexion without the need for chemical brighteners.",
      },
      {
        name: "Red Sandal – The Ancient Skin Tonic",
        origin: "Tamil Nadu Forests",
        image: "/Sandalwood.jpg",
        text: "Sustainably sourced from the sacred groves of Tamil Nadu, Red Sandalwood is a rare Ayurvedic ingredient known for its skin-cooling, anti-aging, and complexion-enhancing properties. It diminishes age spots, refines texture, and restores skin’s youthful radiance, making it a must-have for age-defying skincare.",
      },
    ],
    calmingLine:
      "Turn back time with our rich anti-ageing cream, 100% pure ingredients for youthful skin.",
    trust: [
      { image: "/1.png", label: "100% Natural Ingredients" },
      { image: "/2 (1).png", label: "Organically Cultivated" },
      { image: "/3 (1).png", label: "No Artificial Additives" },
      { image: "/4 (1).png", label: "Cruelty-Free" },
      { image: "/5.png", label: "Ayurvedic Formulation" },
    ],
    usage: {
      eyebrow: "Bhumi Blend · Ayurvedic Anti-Aging Cream",
      title: "How to use",
      steps: [
        { label: "Cleanse", text: "Cleanse your face and neck thoroughly and pat dry." },
        {
          label: "Take",
          text: "Take a small amount of Bhumi Blend Ayurvedic Anti-Aging Cream on your fingertips.",
        },
        {
          label: "Apply",
          text: "Apply evenly to the face and neck using gentle upward circular motions.",
        },
        { label: "Massage", text: "Massage gently until the cream is fully absorbed." },
        {
          label: "Frequency",
          text: "Use twice daily, in the morning and before bedtime, for best results.",
        },
        {
          label: "Protect",
          text: "During the daytime, follow with sunscreen as part of your skincare routine.",
        },
      ],
      tip: "Consistent daily use helps keep the skin hydrated, nourished, and healthy-looking.",
      suitableFor: {
        title: "Who is this cream suitable for?",
        intro:
          "Bhumi Blend Ayurvedic Anti-Aging Cream is ideal for individuals looking to maintain youthful-looking, well-nourished skin through daily care and hydration.",
        points: [
          "Men and women of all ages",
          "Individuals concerned about fine lines and early signs of aging",
          "Dry, normal, and combination skin types",
          "People experiencing dull or tired-looking skin",
          "Those seeking daily hydration and nourishment",
          "Anyone looking to support smoother, softer, and healthier-looking skin",
        ],
      },
    },
    faqs: [
      {
        question: "What is Bhumi Blend Ayurvedic Anti-Aging Cream used for?",
        answer:
          "This cream is designed to help nourish and hydrate the skin while supporting a smoother, softer, and more youthful-looking appearance.",
      },
      {
        question: "Can I use this cream every day?",
        answer:
          "Yes. The cream is suitable for daily use and can be applied in both morning and evening skincare routines.",
      },
      {
        question: "Is this cream suitable for all skin types?",
        answer:
          "It is generally suitable for normal, dry, and combination skin types. Individuals with sensitive skin should perform a patch test before regular use.",
      },
      {
        question: "Can men and women both use this cream?",
        answer:
          "Yes. Bhumi Blend Ayurvedic Anti-Aging Cream is formulated for both men and women seeking healthier-looking, well-nourished skin.",
      },
      {
        question: "At what age can I start using an anti-aging cream?",
        answer:
          "Anti-aging skincare can be incorporated into your routine as early as your mid-20s or whenever you wish to focus on hydration, skin maintenance, and healthy aging.",
      },
    ],
    relatedSlugs: [
      "saffron-face-cream-for-glowing-skin",
      "buy-pure-aloe-vera-gel",
      "natural-face-serum-for-dark-spots-india",
      "gua-sha-face-tool",
      "organic-under-eye-cream",
    ],
  },
  {
    // Same slug the shop, the combo page and the cards already used.
    slug: "ayurvedic-exfoliation-glow-kit",
    // The live page shows no SKU and no size for this kit, so neither is set.
    categories: ["All Products", "Combo"],
    offer: {
      headline: "🎁 Special Offer: Get 20% OFF",
      detail: "Use Coupon Code: BHUMIGLOW20 at checkout",
      code: "BHUMIGLOW20",
    },
    summary: "🌼 Embrace the goodness of Ayurveda – for skin that glows, naturally.",
    // The three products in the kit, in the live page's order.
    bundle: [
      { slug: "natural-face-serum-for-dark-spots-india", quantity: 1 },
      { slug: "nalpamaram-soap", quantity: 1 },
      { slug: "buy-pure-aloe-vera-gel", quantity: 1 },
    ],
    // No reviews yet on the live site (the "Reviews (0)" tab).
    rating: { value: 0, count: 0 },
    // Only one photo was supplied for this kit (the shop's), so there is no
    // thumbnail row.
    gallery: [
      {
        src: "/Ayurvedic-Exfoliation-Glow-Kit.jpg",
        alt: "Bhumi Blend Ayurvedic Exfoliation & Glow Kit: Vitamin C Face Serum, Pure Aloe Healing Gel and Ayurvedic Clarifying Soap",
      },
    ],
    whyChoose: [
      "Inspired by Ayurvedic traditions",
      "Made with plant-based ingredients",
      "Gentle for daily use",
      "Crafted for real results",
    ],
    description: [
      "Reveal smoother, healthier-looking, and naturally radiant skin with the Bhumi Blend Ayurvedic Exfoliation Glow Kit. This carefully curated skincare trio combines Nalpamaram Soap, Vitamin C Face Serum, and Original Aloe Vera Gel with Jasmine to provide a complete cleansing, exfoliating, and hydrating routine inspired by the wisdom of Ayurveda.",
      "The routine begins with Nalpamaram Soap, a unique dual-action Ayurvedic soap featuring a textured side for gentle exfoliation and a smooth side for effective cleansing. It helps remove dirt, impurities, excess oil, and surface buildup while promoting a fresh and healthy-looking appearance.",
      "Next, the Vitamin C Face Serum helps revitalize dull-looking skin and supports a brighter, more even-looking complexion. Its lightweight formula absorbs easily, making it an essential step in your daily glow routine.",
      "Complete your skincare ritual with Original Aloe Vera Gel with Jasmine, a refreshing and hydrating gel made with real aloe vera and infused with jasmine. It helps soothe, moisturize, and refresh the skin while leaving it feeling soft, comfortable, and nourished.",
      "Together, these three products create a simple yet effective skincare routine designed to cleanse, exfoliate, hydrate, and support naturally glowing skin.",
    ],
    descriptionImage: {
      src: "/Web-image-2-1536x658.jpg",
      alt: "Vitamin C Face Serum, Pure Aloe Healing Gel and Ayurvedic Clarifying Soap on a marble ledge beside frangipani flowers, an aloe leaf and rolled white towels",
    },
    // A kit has no ingredient cards, organic line or badges on the live page.
    ingredients: [],
    usage: {
      eyebrow: "Bhumi Blend · Ayurvedic Exfoliation Glow Kit",
      title: "How to use",
      steps: [
        {
          label: "Cleanse & Exfoliate",
          text: "Use the Nalpamaram Soap on damp skin. Gently massage with the textured side for mild exfoliation and use the smooth side for cleansing. Rinse thoroughly and pat dry.",
        },
        {
          label: "Apply Serum",
          text: "Take 2–3 drops of the Vitamin C Face Serum and apply evenly to the face and neck. Gently massage until fully absorbed.",
        },
        {
          label: "Hydrate & Soothe",
          text: "Apply a thin layer of Original Aloe Vera Gel with Jasmine to the face and neck. Allow it to absorb naturally for refreshing hydration and comfort.",
        },
      ],
      tipLabel: "Recommended use",
      tip: "Use the complete routine daily. For sensitive skin, begin exfoliation with the Nalpamaram Soap 2–3 times per week and adjust as needed.",
    },
    faqs: [
      {
        question: "What products are included in the Ayurvedic Exfoliation Glow Kit?",
        answer:
          "The kit includes Nalpamaram Soap, Vitamin C Face Serum, and Original Aloe Vera Gel with Jasmine.",
      },
      {
        question: "What makes this kit different from a regular skincare routine?",
        answer:
          "This kit combines cleansing, gentle exfoliation, brightening, and hydration in one simple routine, helping streamline your skincare regimen.",
      },
      {
        question: "Can I use all the products every day?",
        answer:
          "Yes. The Vitamin C Face Serum and Original Aloe Vera Gel with Jasmine can be used daily. The Nalpamaram Soap can also be used regularly, with gentle exfoliation adjusted according to your skin's needs.",
      },
      {
        question: "Is the Aloe Vera Gel in this kit a regular gel-base product?",
        answer:
          "No. Bhumi Blend Original Aloe Vera Gel is made with real aloe vera and enriched with jasmine, offering a refreshing and nourishing skincare experience.",
      },
      {
        question: "What skincare concerns does this kit help address?",
        answer:
          "The kit helps cleanse impurities, remove surface buildup, hydrate the skin, improve the appearance of dullness, and support a healthy, radiant-looking complexion.",
      },
    ],
    relatedSlugs: [
      "ayurvedic-youth-revival-kit",
      "aloe-pure-shampoo",
      "bhumi-blend-organics-premium-combo-6-soap-set",
      "bhumi-blend-organics-premium-combo-3-soap-set",
      "summer-essentials-luxury-kit",
      "bhumi-blend-mens-combo",
      "bhumi-blend-premium-combo-box",
      "bhumi-blend-starter-combo-box",
      "best-ayurvedic-hair-oil",
      "organic-under-eye-cream",
    ],
  },
  {
    // Same slug the shop, the combo page and the cards already used.
    slug: "ayurvedic-youth-revival-kit",
    // The live page shows no SKU and no size for this kit, so neither is set.
    categories: ["All Products", "Combo"],
    summary: "Ancient wisdom for modern age-defying care.",
    // The three products in the kit, in the live page's order.
    bundle: [
      { slug: "ayurvedic-anti-aging-cream", quantity: 1 },
      { slug: "organic-under-eye-cream", quantity: 1 },
      { slug: "gua-sha-face-tool", quantity: 1 },
    ],
    // No reviews yet on the live site (the "Reviews (0)" tab).
    rating: { value: 0, count: 0 },
    // The kit's two photos (the shop's, and the second one the combo page
    // shows on hover), then the three supplied ones.
    gallery: [
      {
        src: "/Ayurvedic-Youth-Revival-Kit-new.webp",
        alt: "Bhumi Blend Ayurvedic Youth Revival Kit: Revive + Under Eye Corrector, Anti-Ageing Cream and a green Gua Sha tool",
      },
      {
        src: "/combo4-feb-2.jpg",
        alt: "Timeless skin starts here: the Anti-Ageing Cream supports firmness and elasticity, the Under Eye Corrector revives tired, dull eyes and the Gua Sha enhances absorption and glow",
      },
      {
        src: "/combo4-feb-3.jpg",
        alt: "Lift. Renew. Rejuvenate. Targets early signs of ageing with Ayurvedic care: helps reduce the appearance of fine lines, supports smoother-looking skin, boosts circulation with facial massage and nourishes deeply without heaviness",
      },
      {
        src: "/combo4-feb-4.jpg",
        alt: "Your nightly youth ritual: a rich restorative cream, brightening under-eye care and relaxing Gua Sha therapy, shown with a Gua Sha tool along a jawline",
      },
      {
        src: "/combo4-feb-5.jpg",
        alt: "Bhumi Blend Ayurvedic Youth Revival Kit, ancient wisdom for modern age-defying care: a woman’s face between two photos of older skin",
      },
    ],
    whyChoose: [
      "Inspired by Ayurvedic traditions",
      "Made with plant-based ingredients",
      "Gentle for daily use",
      "Crafted for real results",
    ],
    description: [
      "Revitalize your skincare routine with the Bhumi Blend Ayurvedic Youth Revival Kit, a carefully curated collection featuring Ayurvedic Anti-Aging Cream, Organic Under Eye Cream, and the Gua Sha Face Tool. Designed to support hydration, nourishment, and facial wellness, this complete skincare ritual helps maintain smooth, refreshed, and youthful-looking skin.",
      "The Ayurvedic Anti-Aging Cream delivers daily hydration and nourishment to help keep the skin feeling soft, supple, and revitalized. Formulated with Ayurvedic-inspired ingredients, it supports healthy-looking skin while helping improve overall skin comfort and radiance.",
      "The Organic Under Eye Cream provides targeted care for the delicate under-eye area, helping to nourish and hydrate the skin around the eyes while promoting a refreshed appearance.",
      "Completing the routine is the Gua Sha Face Tool, a timeless beauty tool designed to enhance facial massage, improve skincare application, and support a relaxing self-care experience. Regular use can help reduce the appearance of puffiness and leave the skin looking refreshed and revitalized.",
      "Together, these three essentials create a simple yet effective Ayurvedic-inspired routine focused on hydration, facial care, and maintaining a youthful, radiant appearance.",
    ],
    descriptionImage: {
      src: "/Web-image-1-copy-1536x658.jpg",
      alt: "Bhumi Blend Anti-Ageing Cream and Revive + Under Eye Corrector jars beside a green Gua Sha tool on a wooden stand, with a monstera leaf behind",
    },
    philosophy: {
      title: "The Bhumi Blend Philosophy",
      paragraphs: [
        "True anti-ageing is not about reversing time, it’s about supporting your skin with nourishment, balance, and mindful care.",
        "With the Ayurvedic Youth Revival Kit, you embrace timeless beauty powered by nature.",
      ],
    },
    // A kit has no ingredient cards, organic line or badges on the live page.
    ingredients: [],
    usage: {
      eyebrow: "Bhumi Blend · Ayurvedic Youth Revival Kit",
      title: "How to use",
      steps: [
        {
          label: "Ayurvedic Anti-Aging Cream",
          text: "After cleansing, apply a small amount of Ayurvedic Anti-Aging Cream to the face and neck. Gently massage using upward circular motions until fully absorbed.",
        },
        {
          label: "Under Eye Care",
          text: "Take a small amount of Organic Under Eye Cream and gently apply around the under-eye area using your ring finger. Lightly tap until absorbed.",
        },
        {
          label: "Gua Sha Face Tool",
          text: "Using the Gua Sha Face Tool, gently glide across the face and neck using upward and outward strokes. Focus on the jawline, cheeks, forehead, and neck for a relaxing facial massage experience.",
        },
      ],
      tipLabel: "Recommended routine",
      tip: "Use the Ayurvedic Anti-Aging Cream and Organic Under Eye Cream daily, morning and evening. The Gua Sha Face Tool can be used daily or several times a week as part of your skincare and self-care routine.",
    },
    faqs: [
      {
        question: "What products are included in the Ayurvedic Youth Revival Kit?",
        answer:
          "The kit includes Ayurvedic Anti-Aging Cream, Organic Under Eye Cream, and the Gua Sha Face Tool.",
      },
      {
        question: "What is the purpose of the Gua Sha Face Tool?",
        answer:
          "The Gua Sha Face Tool is used to enhance facial massage, support relaxation, improve skincare application, and help reduce the appearance of facial puffiness.",
      },
      {
        question: "Can I use the products in this kit every day?",
        answer:
          "Yes. The Anti-Aging Cream and Organic Under Eye Cream are suitable for daily use, while the Gua Sha Face Tool can be incorporated into your regular skincare routine.",
      },
      {
        question: "Who can use the Ayurvedic Youth Revival Kit?",
        answer:
          "The kit is suitable for men and women looking to maintain hydrated, nourished, and youthful-looking skin through a complete skincare routine.",
      },
      {
        question: "Why should I use a skincare kit instead of individual products?",
        answer:
          "The products in the Ayurvedic Youth Revival Kit are designed to complement one another, providing hydration, targeted under-eye care, and facial massage benefits in one convenient routine.",
      },
    ],
    relatedSlugs: [
      "essential-skin-repair-range",
      "brightening-clarifying-skin-care-range",
      "aloe-pure-shampoo",
      "bhumi-blend-organics-premium-combo-6-soap-set",
      "summer-essentials-luxury-kit",
      "ayurvedic-exfoliation-glow-kit",
      "bhumi-blend-mens-combo",
      "bhumi-blend-premium-combo-box",
      "bhumi-blend-starter-combo-box",
      "organic-under-eye-cream",
    ],
  },
  {
    // Same slug the shop, the combo page and the cards already used.
    slug: "bhumi-blend-mens-combo",
    sku: "BB-MC-2999",
    categories: ["Combo", "Men"],
    // The live page shows no size for this combo, so `weight` is not set.
    tagline: "Pure Ancient Beauty Care for the Modern Gentleman",
    summary: "Grab the Bhumi Blend Men’s Combo for only ₹2999",
    // On the live page the bonus comes after the "Grab the combo" line.
    offer: {
      headline: "Bonus",
      detail: "Save 15% and receive a FREE Original Gua Sha Face Tool!",
      afterSummary: true,
    },
    // The six products in the combo, in the live page's order.
    bundle: [
      { slug: "best-ayurvedic-hair-oil", quantity: 1 },
      { slug: "natural-face-serum-for-dark-spots-india", quantity: 1 },
      { slug: "saffron-face-cream-for-glowing-skin", quantity: 1 },
      { slug: "buy-pure-aloe-vera-gel", quantity: 1 },
      { slug: "organic-rosemary-water", quantity: 1 },
      { slug: "gua-sha-face-tool", quantity: 1 },
    ],
    // No reviews yet on the live site (the "Reviews (0)" tab).
    rating: { value: 0, count: 0 },
    // The two photos from the shop first, then the two supplied ones.
    gallery: [
      {
        src: "/mens-care-2_01.jpg",
        alt: "Bhumi Blend Premium Men’s Skin Care gift box in dark green with gold leaf lines",
      },
      {
        src: "/mens-care-2_02.jpg",
        alt: "Elevate his grooming game with the Bhumi Blend Men’s Combo: a portrait of a man in a white shirt",
      },
      {
        src: "/mens-care-2_003-800x1069.jpg",
        alt: "What’s inside: Pure Aloe Healing Gel, Radiance Elixir Saffron and Aloe Brightening Gel, Botanical Hair Tonic, Vitamin C Face Serum and Root Revival Hair Oil",
      },
      {
        src: "/mens-care-2_04.jpg",
        alt: "Grab the Bhumi Blend Men’s Combo for only ₹2999, save 15% and receive a free original Gua Sha Face Tool",
      },
    ],
    whyChoose: [
      "Inspired by Ayurvedic traditions",
      "Made with plant-based ingredients",
      "Gentle for daily use",
      "Crafted for real results",
    ],
    description: [
      "Elevate his grooming game with the Bhumi Blend Men’s Combo, a thoughtfully curated collection of natural and organic essentials. Perfect as a gift for the special men in your life, this combo brings together the best of nature to enhance hair, skin, and overall confidence.",
    ],
    // Only the description was supplied for this combo: no ingredient cards,
    // organic line, badges, usage steps or FAQ.
    ingredients: [],
    relatedSlugs: [
      "essential-skin-repair-range",
      "ayurvedic-youth-revival-kit",
      "brightening-clarifying-skin-care-range",
      "bhumi-blend-organics-premium-combo-6-soap-set",
      "bhumi-blend-organics-premium-combo-3-soap-set",
      "summer-essentials-luxury-kit",
      "ayurvedic-exfoliation-glow-kit",
      "bhumi-blend-premium-combo-box",
      "bhumi-blend-starter-combo-box",
    ],
  },
  {
    // Renamed from "premium-soap-set-of-3" at the user's request; the shop,
    // combo page and related lists all use this slug now.
    slug: "bhumi-blend-organics-premium-combo-3-soap-set",
    // The live page shows no SKU and no size for this set, so neither is set.
    categories: ["All Products", "Combo"],
    summary:
      "✨A perfect blend of tradition and skincare—because your skin deserves the best!",
    // The three soaps in the set, in the live page's order.
    bundle: [
      { slug: "sandalwood-soap", quantity: 1 },
      { slug: "luxury-shea-butter-soap", quantity: 1 },
      { slug: "nalpamaram-soap", quantity: 1 },
    ],
    // No reviews yet on the live site (the "Reviews (0)" tab).
    rating: { value: 0, count: 0 },
    // The set's two photos (the shop's, and the second one it shows on hover),
    // then the three supplied ones.
    gallery: [
      {
        src: "/3-Combo-Soap-Set.jpg",
        alt: "Bhumi Blend Organics Organic Soap box, pack of 3, 300gm, a product of Kerala",
      },
      {
        src: "/Soap-Combo-Box_02.jpg",
        alt: "A perfect blend of tradition and skincare: Sandalwood Soap, Shea Butter Soap and Nalpamaram Soap stacked in three bars",
      },
      {
        src: "/Soap-Combo-Box_03.jpg",
        alt: "Features: deep cleansing, intense hydration, Ayurvedic formulation, gentle and suitable for all skin types, refreshing aroma",
      },
      {
        src: "/Soap-Combo-Box_04.jpg",
        alt: "Ayurveda’s roots in beauty care: pure, gentle, Ayurvedic, with a woman relaxing in a bath with a towel on her hair",
      },
      {
        src: "/Soap-Combo-Box_05.jpg",
        alt: "Ayurvedic skincare, perfectly packed for you: the 6 in 1 Ultimate Care Combo for ₹1349 and the 3 in 1 Essential Care Combo for ₹699",
      },
    ],
    whyChoose: [
      "Inspired by Ayurvedic traditions",
      "Made with plant-based ingredients",
      "Gentle for daily use",
      "Crafted for real results",
    ],
    // The live Description tab is empty, so no description text was supplied.
    // The Description tab is left out until some is added here.
    description: [],
    ingredients: [],
    relatedSlugs: [
      "ayurvedic-youth-revival-kit",
      "brightening-clarifying-skin-care-range",
      "aloe-pure-shampoo",
      "bhumi-blend-organics-premium-combo-6-soap-set",
      "summer-essentials-luxury-kit",
      "ayurvedic-exfoliation-glow-kit",
      "bhumi-blend-mens-combo",
      "bhumi-blend-premium-combo-box",
      "best-ayurvedic-hair-oil",
      "organic-under-eye-cream",
    ],
  },
  {
    // Renamed from "premium-soap-set-of-6" at the user's request; the shop,
    // combo page and related lists all use this slug now.
    slug: "bhumi-blend-organics-premium-combo-6-soap-set",
    // The live page shows no SKU and no size for this set, so neither is set.
    categories: ["All Products", "Combo"],
    summary:
      "✨A perfect blend of tradition and skincare—because your skin deserves the best!",
    // Two of each soap, in the live page's order.
    bundle: [
      { slug: "sandalwood-soap", quantity: 2 },
      { slug: "luxury-shea-butter-soap", quantity: 2 },
      { slug: "nalpamaram-soap", quantity: 2 },
    ],
    // No reviews yet on the live site (the "Reviews (0)" tab).
    rating: { value: 0, count: 0 },
    // The set's two photos (the shop's, and the second one it shows on hover),
    // then the three supplied ones (the same three the Set of 3 uses).
    gallery: [
      {
        src: "/6-Combo-Soap-Set.jpg",
        alt: "Bhumi Blend Organics Organic Soap box, pack of 6, 300gm, a product of Kerala",
      },
      {
        src: "/Soap-Combo-Box_02.jpg",
        alt: "A perfect blend of tradition and skincare: Sandalwood Soap, Shea Butter Soap and Nalpamaram Soap stacked in three bars",
      },
      {
        src: "/Soap-Combo-Box_03.jpg",
        alt: "Features: deep cleansing, intense hydration, Ayurvedic formulation, gentle and suitable for all skin types, refreshing aroma",
      },
      {
        src: "/Soap-Combo-Box_04.jpg",
        alt: "Ayurveda’s roots in beauty care: pure, gentle, Ayurvedic, with a woman relaxing in a bath with a towel on her hair",
      },
      {
        src: "/Soap-Combo-Box_05.jpg",
        alt: "Ayurvedic skincare, perfectly packed for you: the 6 in 1 Ultimate Care Combo for ₹1349 and the 3 in 1 Essential Care Combo for ₹699",
      },
    ],
    whyChoose: [
      "Inspired by Ayurvedic traditions",
      "Made with plant-based ingredients",
      "Gentle for daily use",
      "Crafted for real results",
    ],
    descriptionHeading: "Bhumi Blend Organics · Premium Combo – 6 Soap Set",
    description: [
      "Elevate your daily bathing ritual with the Bhumi Blend Organics Premium Combo – 6 Soap Set, a thoughtfully curated collection of handcrafted soaps designed to cleanse, nourish, and refresh your skin. Featuring 2 Sacred Glow Sandalwood Soaps, 2 Luxury Shea Butter Soaps, and 2 Nalpamaram Soaps, this premium combo offers six luxurious soap bars that combine traditional Ayurvedic wisdom with modern skincare care.",
      "Each soap in this collection provides a unique skincare experience. The Sacred Glow Sandalwood Soap helps cleanse and refresh the skin while offering the timeless appeal of sandalwood. The Luxury Shea Butter Soap delivers rich nourishment and moisturizing care, leaving the skin feeling soft and smooth. The Nalpamaram Soap features a dual-action design with a textured side for gentle exfoliation and a smooth side for effective cleansing, helping remove buildup and promote healthy-looking skin.",
      "Whether you're looking to enjoy a variety of handcrafted soaps, share them with family, or give the gift of premium skincare, this combo delivers exceptional value and a complete self-care experience. Perfect for everyday use, it transforms ordinary cleansing into a luxurious wellness ritual.",
    ],
    descriptionImage: {
      src: "/Web-image-6-1536x658.jpg",
      alt: "Ayurvedic Clarifying Soap, Sacred Glow Sandalwood Soap and Luxury Shea Butter Soap boxes on a black marble counter beside a plant and a stone basin",
    },
    // A soap set has no ingredient cards, organic line or badges on the live page.
    ingredients: [],
    usage: {
      eyebrow: "Bhumi Blend · Premium Combo 6 Soap Set",
      title: "How to use",
      steps: [
        { label: "Wet", text: "Wet your skin thoroughly with water." },
        { label: "Choose", text: "Choose your preferred soap based on your skincare needs." },
        { label: "Lather", text: "Work the soap into a rich lather." },
        {
          label: "Massage",
          text: "Gently massage onto the face and body using circular motions.",
        },
        { label: "Rinse", text: "Rinse thoroughly with water." },
        {
          label: "Dry",
          text: "Pat dry and follow with a moisturizer or body lotion if desired.",
        },
      ],
      guide: {
        title: "Soap guide",
        items: [
          {
            name: "Sacred Glow Sandalwood Soap",
            text: "Ideal for refreshing daily cleansing and a soothing bathing experience.",
          },
          {
            name: "Luxury Shea Butter Soap",
            text: "Perfect for nourishing and moisturizing the skin while helping maintain softness and comfort.",
          },
          {
            name: "Nalpamaram Soap",
            text: "Use the textured side for gentle exfoliation and the smooth side for cleansing, providing complete skincare in a single bar.",
          },
        ],
      },
      tip: "Store soaps in a well-drained soap dish between uses to help extend their lifespan.",
    },
    faqs: [
      {
        question: "What is included in the Bhumi Blend Organics Premium Combo – 6 Soap Set?",
        answer:
          "The combo includes 2 Sacred Glow Sandalwood Soaps, 2 Luxury Shea Butter Soaps, and 2 Nalpamaram Soaps, giving you a total of 6 premium handmade soap bars.",
      },
      {
        question: "Can I use these soaps on both my face and body?",
        answer:
          "Yes. These soaps are suitable for daily face and body cleansing and can be incorporated into your regular skincare routine.",
      },
      {
        question: "What makes Nalpamaram Soap different from the other soaps?",
        answer:
          "Nalpamaram Soap features a unique dual-action design with a textured side for gentle exfoliation and a smooth side for cleansing.",
      },
      {
        question: "Which soap is best for dry skin?",
        answer:
          "Luxury Shea Butter Soap is ideal for individuals looking for extra nourishment, hydration, and skin softness.",
      },
      {
        question: "Is this combo suitable as a gift?",
        answer:
          "Absolutely. The Premium Combo – 6 Soap Set makes an excellent gift for birthdays, holidays, wellness hampers, and anyone who appreciates natural, handcrafted skincare products.",
      },
    ],
    relatedSlugs: [
      "essential-skin-repair-range",
      "ayurvedic-youth-revival-kit",
      "aloe-pure-shampoo",
      "bhumi-blend-organics-premium-combo-3-soap-set",
      "summer-essentials-luxury-kit",
      "ayurvedic-exfoliation-glow-kit",
      "bhumi-blend-mens-combo",
      "bhumi-blend-premium-combo-box",
      "best-ayurvedic-hair-oil",
      "organic-under-eye-cream",
    ],
  },
  {
    // Renamed from "premium-combo-box" at the user's request; the shop, combo
    // page and related lists all use this slug now.
    slug: "bhumi-blend-premium-combo-box",
    sku: "BB-WC-PR-4999",
    categories: ["Combo", "Woman"],
    // The live page shows no size for this box, so `weight` is not set.
    tagline: "Pure Kerala Beauty, Perfectly Crafted for You",
    summary: "Gift the Best of Kerala’s Beauty – Only with Bhumi Blend",
    // On the live page the bonus comes after the "Gift the best…" line.
    offer: {
      headline: "Bonus",
      detail: "Unlock Radiant Skin with a FREE Original Gua Sha Face Tool",
      afterSummary: true,
    },
    // The nine products in the box, in the live page's order.
    bundle: [
      { slug: "sandalwood-soap", quantity: 1 },
      { slug: "luxury-shea-butter-soap", quantity: 1 },
      { slug: "nalpamaram-soap", quantity: 1 },
      { slug: "natural-face-serum-for-dark-spots-india", quantity: 1 },
      { slug: "saffron-face-cream-for-glowing-skin", quantity: 1 },
      { slug: "root-vitality-ayurvedic-shampoo", quantity: 1 },
      { slug: "best-ayurvedic-hair-oil", quantity: 1 },
      { slug: "organic-rosemary-water", quantity: 1 },
      { slug: "gua-sha-face-tool", quantity: 1 },
    ],
    // No reviews yet on the live site (the "Reviews (0)" tab).
    rating: { value: 0, count: 0 },
    // The two photos from the shop first, then the two supplied ones.
    gallery: [
      {
        src: "/woman-care-2_01.jpg",
        alt: "Bhumi Blend Premium Combo Box: a pink gift box with a gold ring and gold leaf lines",
      },
      {
        src: "/women-care-3_04-1.jpg",
        alt: "Premium Combo Box, ₹4999 after 15% discount: a soap combo, Vitamin C Face Serum, Revive + Under Eye Corrector, Radiance Elixir Saffron and Aloe Brightening Gel, Root Vitality Ayurvedic Shampoo, Root Revival Hair Oil and Botanical Hair Tonic",
      },
      {
        src: "/women-care-3_02-800x1069.jpg",
        alt: "Unveil the wisdom of ancient Kerala with our Bhumi Blend Women’s Combo Boxes: a woman with curly hair resting her chin on her hands",
      },
      {
        src: "/women-care-3_05.jpg",
        alt: "Gift the best of Kerala’s beauty, only with Bhumi Blend: a pink Premium Skin Care Set box and a free Original Gua Sha Face Tool",
      },
    ],
    whyChoose: [
      "Inspired by Ayurvedic traditions",
      "Made with plant-based ingredients",
      "Gentle for daily use",
      "Crafted for real results",
    ],
    description: [
      "Unveil the wisdom of ancient Kerala with our Bhumi Blend Women’s Combo Boxes—beautifully packaged in a premium box with exquisite decoration, designed to elevate your beauty ritual. These thoughtfully curated boxes bring together skincare and haircare essentials that nourish and pamper your skin and hair, perfect as a luxurious gift for your loved ones. Each product is crafted using plant-based, Ayurvedic ingredients, inspired by Kerala’s timeless beauty secrets.",
    ],
    // Only the description was supplied for this box: no ingredient cards,
    // organic line, badges, usage steps or FAQ text.
    ingredients: [],
    relatedSlugs: [
      "essential-skin-repair-range",
      "ayurvedic-youth-revival-kit",
      "brightening-clarifying-skin-care-range",
      "bhumi-blend-organics-premium-combo-6-soap-set",
      "bhumi-blend-organics-premium-combo-3-soap-set",
      "summer-essentials-luxury-kit",
      "ayurvedic-exfoliation-glow-kit",
      "bhumi-blend-mens-combo",
      "bhumi-blend-starter-combo-box",
    ],
  },
  {
    // Same slug the shop, the home page, the hair care page and the cards already used.
    slug: "best-ayurvedic-hair-oil",
    sku: "BB-HC-AHT-200",
    categories: ["All Products", "Hair"],
    weight: "200ml",
    tagline: "Nourish, Strengthen, Shine",
    highlights: ["Promotes growth", "Strengthens roots", "Prevents dandruff", "Adds shine"],
    summary: "Experience healthy and strong hair with our Best Ayurvedic Hair Oil",
    // "Rated 4.00 out of 5 based on 2 customer ratings" and the "Reviews (2)" tab
    // on the live site. No review text was supplied, so only the summary shows.
    rating: { value: 4, count: 2 },
    // The two photos from the shop first, then the three supplied ones.
    gallery: [
      {
        src: "/Hair-Oil-Organic.jpg",
        alt: "Bhumi Blend Organic Root Revival Hair Oil 200ml bottle with aloe, amla, hibiscus and a halved coconut",
      },
      {
        src: "/Hair-Oil-2_05-1.jpg",
        alt: "A perfect blend of pure natural ingredients for timeless haircare: coconut oil, amla, neem, bhringraj, hibiscus, aloe vera, black mustard, tulsi, flaxseed, onion, fenugreek, long pepper, shatavari, Indian sandalwood, cumin, mukkutti, chethi flower and avuri",
      },
      {
        src: "/Hair-Oil-2_04-1-800x1070.jpg",
        alt: "How to use: apply a small amount of oil to the scalp, massage in circular motions, leave in for at least 30 minutes or overnight, wash with a mild shampoo and use 2–3 times a week",
      },
      {
        src: "/Hair-Oil-2_03-1 (1).jpg",
        alt: "Where tradition meets modern care for timeless hair: a woman with long dark wavy hair beside a glass bottle of oil and clay pots",
      },
      {
        src: "/Hair-Oil-2_02-1 (1).jpg",
        alt: "100% organic and chemical-free: improves scalp health, prevents premature greying and suits all hair types, shown with the Root Revival Hair Oil bottle against a palm leaf and sand",
      },
    ],
    whyChoose: [
      "Inspired by Ayurvedic traditions",
      "Made with plant-based ingredients",
      "Gentle for daily use",
      "Crafted for real results",
    ],
    description: [
      "Discover Kerala’s Best Ayurvedic Hair Oil, which is made from a blend of pure organic oils and traditional Ayurvedic herbs, for healthier, stronger, and glossier hair. Natural hair growth is supported, roots are strengthened, and your scalp is deeply nourished by Root Revival Hair Oil. This organic hair oil India product is made entirely of natural ingredients and is devoid of artificial smells and chemicals, providing your hair with the unadulterated care it needs.",
    ],
    keyBenefits: {
      title: "Key Benefits",
      points: [
        "Strengthen hair from the base to the crown.",
        "Encourages the growth of natural hair.",
        "Lessens hair breakage and loss.",
        "Providing smoothness and luster.",
        "Keeps the scalp hydrated and nourished.",
      ],
    },
    philosophy: {
      title: "Why Choose Root Revival Hair Oil?",
      paragraphs: [
        "Because it’s a wellness ritual that goes beyond simply using hair oil. It uses cold-pressed oils and tried-and-true herbs to provide your hair with holistic natural care, drawing inspiration from Kerala’s Ayurvedic tradition.",
      ],
    },
    // All 17 photos are 228×152, the size the ingredient cards show them at.
    ingredients: [
      {
        name: "Coconut Oil",
        origin: "Kerala Coconuts",
        image: "/Coconut-Oil.jpg",
        text: "Sourced from the lush coconut groves of Kerala, this pure, nutrient-rich oil is packed with essential fatty acids and vitamins that deeply hydrate the scalp, strengthen hair roots, and restore vitality. Its intense moisturizing properties help prevent dryness, reduce split ends, and combat frizz, leaving hair soft, silky, and manageable. Known for its natural antibacterial and antifungal benefits, coconut oil also protects the scalp from dandruff and infections, ensuring stronger, healthier, and more resilient hair with every use.",
      },
      {
        name: "Amla",
        origin: "Indian Gooseberry",
        image: "/Amla.jpg",
        text: "A time-honored Ayurvedic treasure, Amla is packed with vitamin C, powerful antioxidants, and essential nutrients that strengthen hair follicles, promote scalp health, and stimulate hair growth. Sourced from the fertile lands of India, this potent superfruit deeply nourishes the roots, enhances natural shine, and prevents premature graying. Its cooling properties help reduce dandruff, soothe scalp irritation, and improve blood circulation, ensuring thicker, healthier, and more resilient hair with every application.",
      },
      {
        name: "Neem",
        origin: "Azadirachta indica",
        image: "/Neem-.jpg",
        text: "A powerful Ayurvedic herb, Neem is revered for its antifungal, antibacterial, and anti-inflammatory properties, making it an ideal solution for scalp health. Sourced from pristine forests, Neem effectively cleanses the scalp, removes buildup, and combats dandruff and itchiness, ensuring a fresh, balanced, and irritation-free scalp. Its natural healing properties strengthen hair roots, reduce hair fall, and support healthy hair growth, while also protecting against scalp infections.",
      },
      {
        name: "Bhringraj",
        origin: "Eclipta alba",
        image: "/Bhringraj-.jpg",
        text: "Known as the “King of Herbs” for hair care, Bhringraj is a powerful Ayurvedic remedy that deeply nourishes the scalp and stimulates hair follicles for stronger, healthier, and thicker hair. Sourced from the finest herbal farms, this potent botanical reduces hair fall, strengthens the roots, and enhances overall hair density. Its natural rejuvenating properties improve scalp circulation, ensuring optimal nutrient absorption and faster hair growth.",
      },
      {
        name: "Hibiscus Leaves & Flowers",
        origin: "Kerala Farms",
        image: "/Hibiscus-Leaves-Flowers-.jpg",
        text: "Packed with vitamin C, amino acids, and antioxidants, hibiscus deeply nourishes the scalp, strengthens roots, and stimulates hair follicles for healthy growth. It prevents hair fall, combats dryness, and restores natural shine, leaving hair soft, voluminous, and radiant. This botanical powerhouse also helps reduce dandruff and premature graying, ensuring stronger, healthier hair.",
      },
      {
        name: "Aloe Vera",
        origin: "Thar Desert Farms",
        image: "/Aloe-Vera.jpg",
        text: "Aloe Vera is a natural moisturizer that deeply hydrates, soothes the scalp, and reduces irritation. Packed with vitamins, enzymes, and amino acids, it strengthens hair from root to tip, reduces dandruff, and promotes healthy growth. Its cooling and healing properties help restore scalp balance, leaving hair soft, nourished, and naturally shiny.",
      },
      {
        name: "Black Mustard",
        origin: "Kerala Farms",
        image: "/Black-Mustard.jpg",
        text: "Black Mustard is a powerful scalp stimulant that boosts blood circulation, strengthens hair roots, and promotes new hair growth. Rich in omega fatty acids, vitamins, and minerals, it deeply nourishes the scalp, prevents hair thinning, and enhances hair density. Its antibacterial properties also help maintain scalp health, reducing dandruff and irritation.",
      },
      {
        name: "Tulsi",
        origin: "Holy Basil",
        image: "/Tulsi-.jpg",
        text: "A revered Ayurvedic herb, Tulsi is packed with antioxidants and antibacterial properties that purify the scalp, reduce infections, and prevent dandruff. It strengthens hair follicles, protects against damage, and promotes thicker, healthier hair. By improving scalp circulation, Tulsi also boosts hair growth and maintains overall hair vitality and shine.",
      },
      {
        name: "Flaxseed",
        origin: "Indian Farms",
        image: "/Flaxseed-.jpg",
        text: "Flaxseed is a nutrient-rich powerhouse loaded with omega-3 fatty acids, vitamins, and antioxidants that deeply hydrate, strengthen, and nourish hair. It helps reduce breakage, improve elasticity, and enhance hair texture, leaving strands smoother, shinier, and more manageable. Flaxseed also soothes the scalp, reduces dryness, and promotes healthier, fuller hair growth.",
      },
      {
        name: "Onion",
        origin: "Indian Farms",
        image: "/Onion-.jpg",
        text: "Rich in sulfur, antioxidants, and essential nutrients, onion strengthens hair roots, boosts growth, and reduces thinning. It enhances scalp circulation, revitalizing hair follicles for thicker, fuller hair. Its antibacterial properties help combat dandruff and scalp infections, while also reducing breakage and adding natural shine, making hair healthier, stronger, and more voluminous.",
      },
      {
        name: "Fenugreek",
        origin: "Tribal Farms",
        image: "/Fenugreek.jpg",
        text: "Rich in proteins, nicotinic acid, and essential nutrients, fenugreek strengthens hair follicles, reduces hair fall, and deeply nourishes the scalp. Its antifungal properties help combat dandruff and irritation, while its natural conditioning effects enhance hair texture, adding smoothness and shine. Fenugreek also promotes thicker, healthier hair growth and prevents premature graying.",
      },
      {
        name: "Long Pepper",
        origin: "Kerala Spices",
        image: "/Long-Pepper.jpg",
        text: "A powerful scalp stimulant, long pepper enhances blood circulation, ensuring better nutrient absorption for stronger, healthier hair growth. Rich in antioxidants and essential compounds, it strengthens hair roots, reduces hair fall, and prevents scalp infections. Its revitalizing properties also help improve hair texture, boost volume, and promote overall scalp health.",
      },
      {
        name: "Shatavari",
        origin: "Asparagus racemosus",
        image: "/Shatavari-.jpg",
        text: "A powerful Ayurvedic adaptogen, Shatavari helps balance hormonal levels, reducing stress-induced hair fall and thinning. Rich in antioxidants and essential nutrients, it nourishes hair follicles, strengthens roots, and supports healthy scalp function. Its hydrating properties also help maintain moisture balance, leaving hair softer, shinier, and more resilient.",
      },
      {
        name: "Indian Sandalwood",
        origin: "Kerala Forests",
        image: "/Sandalwood.jpg",
        text: "Renowned for its cooling and healing properties, Indian sandalwood improves scalp circulation, ensuring better nutrient absorption for stronger hair growth. It helps balance oil production, keeping the scalp hydrated yet non-greasy. With its antibacterial and soothing effects, it reduces irritation, promotes a healthier scalp, and enhances hair’s natural shine and strength.",
      },
      {
        name: "Mukkutti",
        origin: "Indian Herb",
        image: "/Mukkutti-.jpg",
        text: "A treasured Ayurvedic herb, Mukkutti deeply nourishes the scalp, strengthening hair from root to tip. Rich in essential nutrients and antioxidants, it conditions hair, enhances texture, and prevents dryness. Its natural healing properties soothe the scalp, reduce irritation, and promote healthy, lustrous hair, making it an ideal ingredient for holistic hair care.",
      },
      {
        name: "Chethi Flower",
        origin: "Indian Jasmine",
        image: "/Chethi-Flower-.jpg",
        text: "Packed with antioxidants and essential nutrients, the Chethi flower stimulates hair growth, strengthens roots, and enhances scalp health. Its natural conditioning properties boost shine, reduce dryness, and improve hair texture. With its soothing and antimicrobial benefits, it helps maintain a balanced, healthy scalp, preventing dandruff and irritation for naturally vibrant hair.",
      },
      {
        name: "Avuri",
        origin: "Indian Herb",
        image: "/Avuri-Indian-Herb-.jpg",
        text: "A revered Ayurvedic herb, Avuri strengthens hair follicles, reducing hair fall and breakage. Rich in essential nutrients and antioxidants, it nourishes the scalp, enhances hair texture, and promotes thicker, healthier growth. Its natural conditioning properties help restore vitality, leaving hair soft, shiny, and resilient against environmental stressors.",
      },
    ],
    calmingLine:
      "Nourish your hair with our 100% pure, organic oil for a lustrous, healthy shine.",
    trust: [
      { image: "/1.png", label: "100% Natural Ingredients" },
      { image: "/2 (1).png", label: "Organically Cultivated" },
      { image: "/3 (1).png", label: "No Artificial Additives" },
      { image: "/4 (1).png", label: "Cruelty-Free" },
      { image: "/5.png", label: "Ayurvedic Formulation" },
    ],
    // The live page has Usage Instructions and FAQ tabs, but no text for them
    // was supplied, so neither is set (a tab only appears when it has content).
    relatedSlugs: [
      "essential-skin-repair-range",
      "ayurvedic-youth-revival-kit",
      "brightening-clarifying-skin-care-range",
      "pure-leaf-aloe-conditioner",
      "aloe-pure-shampoo",
      "bhumi-blend-organics-premium-combo-6-soap-set",
      "summer-essentials-luxury-kit",
      "ayurvedic-exfoliation-glow-kit",
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
