// The posts on /blog, newest first. `image` is a file in /public.
// `date` is the publish day (YYYY-MM-DD). `category` is the small label on the card (default "Blog").
export type BlogPost = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  image: string;
  category?: string;
  /** The name shown after "By" (as on the live site; some posts show none). */
  author?: string;
};

export const blogPosts: BlogPost[] = [
  {
    slug: "best-moisturizer-for-oily-skin-in-humid-weather-what-should-you-look-for",
    title: "Best Moisturizer for Oily Skin in Humid Weather: What Should You Look For? –",
    date: "2026-10-15",
    excerpt:
      "Oily skin and humid weather are a frustrating combination. Your face feels greasy by noon, makeup slides off, and most moisturizers just seem to add another layer of shine you never asked for. So the question becomes: should you skip moisturizer altogether? Absolutely not. Skipping moisture actually triggers your skin to produce even more sebum…",
    image: "/2026-10-15-moisturizer-for-oily-skin-d3515d.webp",
  },
  {
    slug: "switching-to-natural-shampoo-cleared-my-flakes",
    title: "Switching to Natural Shampoo Cleared My Flakes",
    date: "2026-09-24",
    excerpt:
      "I spent years trying every anti-dandruff shampoo on the shelf. The blue bottles, the medicated ones, the clinical-smelling formulas that promised results in two washes. Some worked for a week. Most made my scalp drier, itchier, and more irritated than before. Then I tried a natural shampoo for dandruff, and within a few weeks, the…",
    image: "/2026-09-24-natural-shampoo-for-dandruff-india-a314d0-1.webp",
  },
  {
    slug: "post-monsoon-skin-reset-the-natural-way-to-brighten-dull-uneven-skin-with-vitamin-c",
    title: "Post-Monsoon Skin Reset: The Natural Way to Brighten Dull & Uneven Skin with Vitamin C",
    date: "2026-09-02",
    excerpt:
      "The monsoon season leaves behind more than just puddles and damp air. For your skin, weeks of humidity, fluctuating temperatures, and trapped moisture often result in dullness, clogged pores, stubborn dark spots, and an uneven complexion that no amount of cleansing seems to fix. This is the time your skin needs a proper reset. A…",
    image: "/2026-09-02-vitamin-c-serum-for-pigmentation-ae9561.webp",
  },
  {
    slug: "festive-season-skin-prep-timeline-your-3-week-glow-countdown",
    title: "Festive Season Skin Prep Timeline: Your 3 Week Glow Countdown",
    date: "2026-08-28",
    excerpt:
      "The festive season is almost here, and your calendar is filling up with dinners, parties, and celebrations. But glowing, camera-ready skin doesn’t happen overnight. It takes a plan, the right products, and a realistic timeline to get your complexion where you want it. That’s exactly why a structured festive season skin prep routine matters. Starting…",
    image: "/2026-08-28-festive-season-skin-prep-3e296d.webp",
  },
  {
    slug: "fungal-acne-vs-regular-acne-how-to-tell-apart",
    title: "Fungal Acne vs Regular Acne: How to Tell Apart",
    date: "2026-08-12",
    excerpt:
      "You follow a solid skincare routine, use the right cleanser, and still wake up with clusters of tiny bumps that refuse to go away. Sound familiar? There is a good chance you are dealing with fungal acne, not the regular kind. And the treatment for each one is completely different. Understanding the difference between fungal…",
    image: "/2026-08-12-fungal-acne-vs-regular-acne-5352dd.webp",
  },
  {
    slug: "dark-underarms-real-causes-and-the-body-care-routine-to-fix-them",
    title: "Dark Underarms: Real Causes and the Body Care Routine to Fix Them",
    date: "2026-07-30",
    excerpt:
      "Dark Underarms: Real Causes and the Body Care Routine to Fix Them Dark underarms can feel frustrating, especially when you want to wear sleeveless tops or raise your arms without a second thought. The good news is that underarm darkening is incredibly common and, in most cases, completely fixable with the right approach. Understanding why…",
    image: "/how-to-get-rid-of-dark-underarms-bfcea4.jpg",
  },
  {
    slug: "monsoon-skincare-survival-guide-lightweight-routine-for-humid-indian-weather",
    title: "Monsoon Skincare Survival Guide: Lightweight Routine for Humid Indian Weather",
    date: "2026-07-09",
    author: "BhumiBlend",
    excerpt:
      "The moment the first monsoon showers hit, your skin starts behaving like it has its own agenda. Pores open up, oil production goes into overdrive, and that fresh-faced glow you worked on all summer gets replaced by a sticky, breakout-prone mess. Sound familiar? A solid monsoon skincare routine is not about piling on more products….",
    image: "/baner-4-768x425.jpg",
  },
  {
    slug: "is-my-shampoo-making-my-dandruff-worse",
    title: "Is My Shampoo Making My Dandruff Worse?",
    date: "2026-06-30",
    excerpt:
      "You have been using a dandruff shampoo for weeks, maybe even months, but the flaking and itching have not improved. In fact, they might be getting worse. If that sounds familiar, you are not alone. Millions of people deal with this exact frustration, and the problem is often hiding in plain sight inside your shampoo…",
    image: "/2026-06-30-dandruff-shampoo-4e486e.webp",
  },
  {
    slug: "what-makes-natural-skincare-safer-for-skin",
    title: "What Makes Natural Skincare Safer for Skin?",
    date: "2026-06-12",
    excerpt:
      "Your skin absorbs a significant portion of what you put on it, so the quality of your skincare products matters more than most people realize. With growing awareness around ingredient safety, many people are asking a straightforward question: is natural skincare safer for your skin? The answer is nuanced, but the trend toward plant-based skincare…",
    image: "/is-natural-skincare-safer-for-your-skin-d6d49b.jpg",
  },
  {
    slug: "the-ultimate-anti-ageing-skincare-with-natural-ingredients",
    title: "The Ultimate Anti Ageing Skincare with Natural Ingredients",
    date: "2026-05-29",
    author: "BhumiBlend",
    excerpt:
      "Fine lines don’t show up overnight. They build slowly, and by the time you notice them, your skin has already been asking for help for a while. The good news is that you don’t need synthetic chemicals or aggressive treatments to turn things around. Natural anti ageing skincare rooted in time-tested traditions can deliver real,…",
    image: "/Serum-Blog-poster-6-b-2048x955.jpg",
  },

  // ───── Page 2 of the blog (the live site's /blogs/page/2/) ─────
  {
    slug: "organic-vitamin-c-serum-vs-chemical-serums-what-are-you-really-putting-on-your-skin",
    title: "Organic Vitamin C Serum vs Chemical Serums: What Are You Really Putting on Your Skin?",
    date: "2026-05-27",
    author: "BhumiBlend",
    excerpt:
      "Flip over the bottle of your favorite vitamin C serum and read the ingredient list. If half the words look like they belong in a chemistry textbook, that should give you pause. The skincare market is flooded with serums that promise brighter, younger-looking skin, but most of them rely on synthetic ingredients, artificial stabilizers, and…",
    image: "/2026-05-27-organic-vitamin-c-serum-01ff93 (1).webp",
  },
  {
    slug: "how-to-remove-sun-tan-from-hands-and-legs",
    title: "How to Remove Sun Tan from Hands and Legs",
    date: "2026-05-26",
    author: "BhumiBlend",
    excerpt:
      "Spending time outdoors is great until you notice your hands and legs are a few shades darker than the rest of your body. Sun tan happens when your skin produces excess melanin to protect itself from UV rays, and while it fades over time, most of us want it gone much sooner than that. Whether…",
    image: "/how-to-remove-sun-tan-from-hands-and-legs-fb116f.jpg",
  },
  {
    slug: "how-to-pick-a-natural-serum-for-dark-spots",
    title: "How to Pick a Natural Serum for Dark Spots",
    date: "2026-05-25",
    author: "BhumiBlend",
    excerpt:
      "Dark spots, uneven skin tone, and stubborn pigmentation are some of the most common skin concerns for Indian skin. Whether it is post-acne marks, sun damage, or melasma, these patches can be frustrating to deal with. And while the market is flooded with chemical-heavy solutions, more people are now turning to plant-based brightening serums that…",
    image: "/best-natural-face-serum-for-dark-spots-in-india-c659da.jpg",
  },
  {
    slug: "how-to-choose-the-right-hair-oil-for-you",
    title: "How to Choose the Right Hair Oil for You",
    date: "2026-05-22",
    author: "BhumiBlend",
    excerpt:
      "Not every hair oil works for every person. What makes your friend’s hair glossy and smooth might leave yours looking flat and greasy. The difference often comes down to one thing: choosing the best hair oil for your hair type. Your hair texture, scalp condition, and styling habits all play a role in which oils…",
    image: "/img.jpg",
  },
  {
    slug: "what-causes-sudden-hair-fall-and-how-to-stop-it",
    title: "What Causes Sudden Hair Fall and How to Stop It",
    date: "2026-05-20",
    author: "BhumiBlend",
    excerpt:
      "Finding clumps of hair on your pillow or watching strands swirl down the shower drain can be alarming. When hair loss hits without warning, most people jump straight to worst-case scenarios. The truth is, sudden hair fall causes range from everyday stress to underlying health conditions, and most of them are entirely reversible once you…",
    image: "/unhappy-young-indian-woman-brushing-her-damaged-hair-2048x1365.jpg",
  },
  {
    slug: "why-does-your-skin-feel-dry-after-moisturizing",
    title: "Why Does Your Skin Feel Dry After Moisturizing?",
    date: "2026-05-19",
    author: "BhumiBlend",
    excerpt:
      "You just slathered on lotion, gave it time to absorb, and your skin still feels tight, flaky, or parched. It makes no sense. You did the thing you were supposed to do, so why does your skin feel dry even after moisturizing? This is one of the most common frustrations people bring up in dermatology…",
    image: "/h (1).jpg",
  },
  {
    slug: "is-aloe-vera-gel-really-good-for-your-skin-and-hair",
    title: "Is Aloe Vera Gel Really Good for Your Skin and Hair?",
    date: "2026-05-18",
    excerpt:
      "Aloe vera has been used for centuries as a natural remedy for everything from sunburns to scalp irritation. But with so many skincare trends coming and going, it’s fair to ask whether this humble plant truly lives up to the hype. The short answer? Yes. The aloe vera gel benefits for skin and hair are…",
    image: "/aloe-vera-gel-benefits-for-skin-and-hair-fcbef2.jpg",
  },
  {
    slug: "your-30s-skincare-wakeup-call",
    title: "Your 30’s Skincare Wakeup Call",
    date: "2026-03-31",
    author: "BhumiBlend",
    excerpt:
      "It’s not dramatic. It’s not overnight. But one morning, you might look in the mirror and notice something slightly unfamiliar. Your skin still looks like you, but it feels different. A little less forgiving. A little slower to bounce back. Late nights show more clearly. Dehydration lingers longer. That faint line near your eyes doesn’t…",
    image: "/Skincare-in-your-30s.jpg",
  },
  {
    slug: "5-skincare-myths-you-can-let-go-of",
    title: "5 Skincare Myths You Can Let Go Of",
    date: "2026-03-10",
    author: "BhumiBlend",
    excerpt:
      "Skincare advice travels fast. Faster than science, sometimes. A friend swears by skipping moisturizer if you have oily skin. Social media tells you you need ten steps in your routine. Someone else insists that natural products “don’t really work.” It’s easy to feel overwhelmed and slightly skeptical. At Bhumi Blend, we often meet customers who…",
    image: "/Skincare-myths.jpg",
  },
  {
    slug: "are-dark-circles-really-caused-by-lack-of-sleep-or-are-most-people-treating-them-the-wrong-way",
    title: "Are Dark Circles Really Caused by Lack of Sleep Or Are Most People Treating Them the Wrong Way?",
    date: "2026-02-26",
    author: "BhumiBlend",
    excerpt:
      "Dark circles are one of the most misunderstood skincare concerns. For years, the advice has been simple: sleep more. While rest is important, many people quickly realize something frustrating, even after good sleep, the dark circles remain. At BhumiBlend, this question comes up often: If it’s not just sleep, what’s really causing dark circles and…",
    image: "/blh.jpg",
  },

  // ───── Page 3 of the blog (the live site's /blogs/page/3/) ─────
  // These have no article text yet, so their slugs are guesses made from the titles.
  {
    slug: "is-retinol-the-best-anti-aging-solution",
    title: "Is Retinol the Best Anti-Aging Solution?",
    date: "2026-02-17",
    author: "BhumiBlend",
    excerpt:
      "Retinol has become almost synonymous with anti-aging. Scroll through skincare advice online and you’ll see it praised as the gold standard for wrinkles, texture, and firmness. Dermatologists recommend it. Influencers swear by it. Brands build entire product lines around it. But as more people incorporate retinol into daily routines, a quieter question is starting to…",
    image: "/blog-768x357.jpg",
  },
  {
    slug: "lets-talk-about-blackheads-whiteheads-and-how-bhumi-blend-helps-you-heal-gently",
    title: "Let’s Talk About Blackheads & Whiteheads And How Bhumi Blend Helps You Heal Gently",
    date: "2026-01-30",
    author: "BhumiBlend",
    excerpt:
      "If you’ve ever leaned closer to the mirror and sighed at tiny dots across your nose or chin, you’re not alone. Blackheads and whiteheads show up quietly, often when we feel like we’re doing everything “right.” Many of our customers at Bhumi Blend tell us the same story: I cleanse. I exfoliate. Why are these…",
    image: "/blod3-768x357.jpg",
  },
  {
    slug: "how-to-age-gracefully-restore-rejuvenate-and-glow-naturally",
    title: "How to Age Gracefully – Restore, Rejuvenate, and Glow Naturally",
    date: "2026-01-21",
    author: "BhumiBlend",
    excerpt:
      "Aging does not announce itself with fireworks. It shows up quietly, the first fine line you notice while washing your face, the skin that feels less springy after a long day, the glow that takes more intention to maintain. Most of us do not want to look twenty forever. We want to look calm, confident,…",
    image: "/blogss-768x357.jpg",
  },
  {
    slug: "glow-nourish-restore-ayurvedic-beauty-rituals-for-skin-and-scalp-health",
    title: "Glow, Nourish, Restore: Ayurvedic Beauty Rituals for Skin and Scalp Health",
    date: "2025-11-28",
    author: "BhumiBlend",
    excerpt:
      "Ayurveda has always treated beauty as an extension of wellness, a harmony between herbs, oils, diet, lifestyle, and self-care. In today’s world, where skincare trends evolve overnight and haircare routines often become complicated, many people are finding comfort in returning to traditional Ayurvedic rituals. These practices don’t promise overnight miracles, but they do offer something…",
    image: "/BhumiBlog3-768x357.jpg",
  },
  {
    slug: "do-ayurvedic-face-serums-really-work-ingredients-that-have-clinical-backing",
    title: "Do Ayurvedic Face Serums Really Work? Ingredients That Have Clinical Backing",
    date: "2025-11-24",
    author: "BhumiBlend",
    excerpt:
      "Ayurvedic Face Serums That Truly Work Ayurveda has been around for thousands of years, yet its wisdom feels more relevant than ever especially in skincare. As modern consumers demand cleaner, more transparent products, people are turning back to ancient botanicals that genuinely nourish the skin rather than overload it. At Bhumi Blend, we see this…",
    image: "/BlogNov2-1-768x357.jpg",
  },
  {
    slug: "menopause-skin-changes-ayurvedic-ingredients-that-help-with-dryness-dullness",
    title: "Menopause Skin Changes: Ayurvedic Ingredients That Help with Dryness & Dullness",
    date: "2025-10-30",
    author: "BhumiBlend",
    excerpt:
      "Understanding How Menopause Affects Your Skin Menopause is a natural transition, but it often brings visible and physical changes that can catch many women off guard especially when it comes to the skin. As estrogen levels decline, the body produces less collagen and natural oils, leading to dryness, dullness, and loss of elasticity. Fine lines…",
    image: "/blogimg3.jpg",
  },
  {
    slug: "vitamin-c-serum-in-ayurveda-inspired-routines",
    title: "Vitamin C Serum in Ayurveda-Inspired Routines: When to Use It (and When Not To)",
    date: "2025-10-22",
    author: "BhumiBlend",
    excerpt:
      "Ayurveda, India’s 5,000-year-old healing system, has always emphasized radiant skin as a reflection of inner harmony. In modern Ayurvedic skincare in India, Vitamin C serum has earned a reputation for brightening dullness, fading pigmentation, and restoring balance; much like Ayurveda’s own holistic glow rituals. But here’s the interesting part: when used thoughtfully, Vitamin C…",
    image: "/Organic-Vitamin-C-serum-with-Ayurvedic-ingredients-like-amla-and-turmeric-for-glowing-skin-Bhumi-Blend-skincare-India-768x357.webp",
  },
  {
    slug: "spa-luxury-at-home-with-bhumi-blend",
    title: "Spa Luxury at Home with Bhumi Blend",
    date: "2025-09-26",
    author: "bhumiblend",
    excerpt:
      "Why Spa Luxury at Home Is Transforming Self-Care in 2025 For many, the idea of a spa visit means time, travel, and expense but in 2025, the concept of a luxury spa at home has moved mainstream. Bhumi Blend Skincare makes it possible to enjoy a professional at-home spa experience with products rooted in Ayurveda…",
    image: "/Untitled-design-768x357.webp",
  },
  {
    slug: "choose-best-ayurvedic-hair-oil-for-healthy-and-glowing-hair",
    title: "Choose Best Ayurvedic Hair Oil for Healthy and Glowing Hair",
    date: "2025-09-16",
    author: "allcitygroup@gmail.com",
    category: "Uncategorized",
    excerpt:
      "When it comes to hair care, the choices seem endless: shampoos promising instant shine, serums claiming frizz-free results, and oils that promise overnight miracles. Yet, if you’ve ever found yourself frustrated with quick fixes that don’t last, you’re not alone. More and more people are turning back to ancient wisdom, seeking remedies that are natural,…",
    image: "/woman-doing-herself-scalp-massage-768x512.jpg",
  },
  {
    slug: "where-keralas-timeless-ayurvedic-secrets-meet-modern-skincare-science",
    title: "Where Kerala’s Timeless Ayurvedic Secrets Meet Modern Skincare Science",
    date: "2025-08-20",
    author: "allcitygroup@gmail.com",
    excerpt:
      "For centuries, Kerala has been celebrated as the land of Ayurveda, a place where nature’s remedies and holistic healing traditions have been carefully preserved. Today, as modern skincare science continues to evolve, people are rediscovering the value of age-old Ayurvedic practices. The blending of these two worlds is creating a new era in beauty and…",
    image: "/Where-Keralas-Timeless-Ayurvedic-Secrets-Meet-Modern-Skincare-Science-768x357.webp",
  },
  {
    slug: "how-to-manage-dryness-and-flaking-in-sensitive-skin",
    title: "How to Manage Dryness and Flaking in Sensitive Skin",
    date: "2025-07-24",
    author: "allcitygroup@gmail.com",
    excerpt:
      "Dry, flaky skin isn’t just uncomfortable, it’s a sign that your skin’s natural barrier needs support. For those with sensitive skin, the issue is even more delicate. A sudden change in weather, using the wrong cleanser, or trying trendy activities can lead to irritation, redness, or peeling. But here’s the good news: with the right…",
    image: "/Manage-Dryness-and-Flaking-in-Sensitive-Skin-1.webp",
  },
  {
    slug: "best-skin-care-for-aging-skin",
    title: "Skin Care For Aging Skin: Minimizing Age Spots, Wrinkles, & Undereye Bags",
    date: "2025-07-14",
    author: "BhumiBlend",
    excerpt:
      "Aging is a beautiful and inevitable part of life, but its visible signs on our skin can sometimes feel daunting. Whether it’s age spots that seem to appear overnight, fine lines that deepen over time, or persistent under-eye bags that make you look more tired than you feel, caring for aging skin requires a thoughtful,…",
    image: "/Best-Skin-Care-For-Aging-Skin-2.jpg",
  },
  {
    slug: "choosing-the-right-hair-oil-for-premature-greying",
    title: "Choosing The Right Hair Oil For Premature Greying",
    date: "2025-06-26",
    author: "BhumiBlend",
    excerpt:
      "Say Goodbye to Early Greys: The Right Hair Oil Can Help Premature greying of hair is a concern that affects many, regardless of age or gender. It can be emotionally frustrating and sometimes even impact one’s confidence. While there are numerous commercial products and hair dyes available to mask the grey, more and more people…",
    image: "/Best-Ayurvedic-Hair-Oil-For-Premature-Greying.jpg",
  },
  {
    slug: "what-is-vegan-skincare-the-real-benefits-of-using-vegan-skincare-products",
    title: "What Is Vegan Skincare – The Real Benefits of Using Vegan Skincare Products",
    date: "2025-06-16",
    author: "BhumiBlend",
    excerpt:
      "When you walk into the skincare aisle today, it’s easy to get overwhelmed by buzzwords like “organic,” “cruelty-free,” “clean beauty,” and “vegan.” But what does vegan skincare mean, and why does it matter? Let’s unpack this through the lens of Bhumi Blend, a brand that combines ancient Ayurvedic wisdom with modern vegan skincare formulations. What…",
    image: "/Vegan-Skincare.jpg",
  },
  {
    slug: "how-to-create-a-sustainable-skincare-routine",
    title: "How To Create a Sustainable Skincare Routine",
    date: "2025-05-28",
    author: "BhumiBlend",
    excerpt:
      "Creating a sustainable skincare routine is not only beneficial for your skin but also for the environment. As more people become conscious of their impact on the planet, adopting eco-friendly habits in daily beauty routines is gaining importance. A sustainable skincare routine focuses on using minimal, clean, and ethically sourced products while reducing waste and…",
    image: "/Skincare-Routine.jpg",
  },
  {
    slug: "benefits-of-using-paraben-free-skincare-products",
    title: "Benefits of Using Paraben-Free Skincare Products",
    date: "2025-05-28",
    author: "BhumiBlend",
    excerpt:
      "table of contents 1. What Are Parabens? 2. Why Are Parabens Harmful in Skincare? 3. Why Ayurvedic Products Offer More Than Just Being Paraben-Free 4. Key Benefits 5. How to Start Using Paraben-Free Skincare Products India 6. Best Ayurvedic Skin Care Products: Bhumi Blend’s Paraben-Free Favorites At Bhumi Blend, we strongly believe in providing our…",
    image: "/Paraben-Free-Skincare-India.jpg",
  },
  {
    slug: "why-is-it-important-to-have-cruelty-free-beauty-products-india",
    title: "Why Is It Important To Have Cruelty-Free Beauty Products India",
    date: "2025-05-28",
    author: "BhumiBlend",
    excerpt:
      "table of contents 1. Promotes Ethical Beauty Choices 2. Better for Your Skin and Overall Health 3. Supports Sustainable and Eco-Friendly Practices 4. Reflects a Growing Conscious Consumer Movement in India 5. Empowers You to Make a Positive Impact 6. Clean Beauty Products In India: Where Clean Meets Compassion India’s beauty and skincare industry has…",
    image: "/Beauty-Products-India.jpg",
  },
];

/** Posts per page of the blog list; page 1 is /blog, page 2 is /blog/page/2, and so on. */
export const blogPageSize = 10;
