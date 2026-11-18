// Content of /ingredients-benefits. The headings, taglines and the opening of
// each description come from the live site's page; the screenshot cut each
// description off, so the endings are written to match their opening.
export const ingredientsPage = {
  hero: {
    eyebrow: "Ingredients & Benefits",
    heading: "The Power of Ayurvedic Harmony",
    text: "Reconnect with nature’s healing touch—pure botanicals, backed by science, for radiant skin and hair.",
    ctaLabel: "Shop",
    ctaHref: "/shop",
    // 1500x282 strip: bottles and the woman sit on the right, the left is a
    // flat dark area that the layout crops away.
    image: "/bannerj.webp",
    imageAlt:
      "A smiling woman with curly hair resting her chin on her hands beside Bhumi Blend Pure Leaf Aloe Conditioner and Root Revival Hair Oil",
  },
  coreHeading: "Core Ingredients & Benefits",
  ingredients: [
    {
      name: "Billy Goat Plum",
      benefit: "Vitamin C Powerhouse",
      text: "Naturally rich in Vitamin C, it helps brighten dull-looking skin and supports an even-toned, radiant glow.",
      highlight: "Vitamin C",
      image: "/img_bb3.jpg",
      imageAlt: "Fresh green Billy Goat plums with water droplets, one cut open to show its pink flesh",
    },
    {
      name: "Chamomile Flower",
      benefit: "Calm & Soothe",
      text: "Anti-inflammatory, perfect for sensitive skin: it helps calm redness and leaves skin feeling soothed and comfortable.",
      image: "/img_bb1.jpg",
      imageAlt: "A bed of white chamomile flowers with yellow centres",
    },
    {
      name: "Sandalwood",
      benefit: "Skin Healing & Glow",
      text: "Reduces acne, soothes irritation and helps even out skin tone for a naturally radiant glow.",
      image: "/img_bb2.jpg",
      imageAlt: "A wooden spoon heaped with red sandalwood chips",
    },
  ],
  why: {
    heading: "Why Ayurvedic Skincare?",
    intro: "Rooted in tradition, designed for modern skincare needs.",
    // Plain cream panel with herbs and bottles along its right edge; its colour
    // is the image's own background so the two blend.
    image: "/banerG.webp",
    points: [
      { lead: "No harmful chemicals", text: " (SLS, parabens, artificial fragrances)" },
      { text: "Handcrafted in Kerala with ethically sourced ingredients" },
      { text: "Inspired by centuries-old Ayurveda, perfected for modern skincare" },
    ] as { lead?: string; text: string }[],
  },
};
