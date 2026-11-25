import type { Metadata } from "next";
import Image from "next/image";
import { Montserrat } from "next/font/google";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Our Formula | Bhumi Blend Organics",
  description:
    "At Bhumi Blend, we believe in the power of pure, unaltered nature. Our formulations bring together the wisdom of Ayurveda and modern science for skin, hair, and body care.",
};

// The five cards use Montserrat for their text, as on the live site.
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400"] });

// Wording and order are the ones on the live bhumiblend.com/our-formula/.
// Icons: Font Awesome Free (solid), CC BY 4.0 — https://fontawesome.com/license/free
const pillars = [
  {
    title: "100% Natural & Real Ingredients",
    text: "We never compromise on quality. Our products are made from whole, unprocessed botanicals, herbs, and oils—never synthetic extracts or diluted compounds. This ensures maximum potency, delivering true nourishment and long-lasting results.",
    // Leaf
    viewBox: "0 0 512 512",
    path: "M272 96c-78.6 0-145.1 51.5-167.7 122.5c33.6-17 71.5-26.5 111.7-26.5h88c8.8 0 16 7.2 16 16s-7.2 16-16 16H288 216s0 0 0 0c-16.6 0-32.7 1.9-48.3 5.4c-25.9 5.9-49.9 16.4-71.4 30.7c0 0 0 0 0 0C38.3 298.8 0 364.9 0 440v16c0 13.3 10.7 24 24 24s24-10.7 24-24V440c0-48.7 20.7-92.5 53.8-123.2C121.6 392.3 190.3 448 272 448l1 0c132.1-.7 239-130.9 239-291.4c0-42.6-7.5-83.1-21.1-119.6c-2.6-6.9-12.7-6.6-16.2-.1C455.9 72.1 418.7 96 376 96L272 96z",
  },
  {
    title: "Certified Organic Goodness",
    text: "Every ingredient in Bhumi Blend’s products is sourced from organic farms, ensuring they are grown without harmful pesticides or chemicals. This means you get pure, chemical-free care that works in harmony with your body.",
    // Seedling
    viewBox: "0 0 512 512",
    path: "M512 32c0 113.6-84.6 207.5-194.2 222c-7.1-53.4-30.6-101.6-65.3-139.3C290.8 46.3 364 0 448 0h32c17.7 0 32 14.3 32 32zM0 96C0 78.3 14.3 64 32 64H64c123.7 0 224 100.3 224 224v32V480c0 17.7-14.3 32-32 32s-32-14.3-32-32V320C100.3 320 0 219.7 0 96z",
  },
  {
    title: "Medicinal & Healing Botanicals",
    text: "Our formulations are enriched with therapeutic herbs like saffron, turmeric, neem, and aloe vera—ingredients known for their powerful healing, anti-inflammatory, and rejuvenating properties. Each blend is designed to restore balance and enhance natural beauty.",
    // Mortar and pestle
    viewBox: "0 0 512 512",
    path: "M504.3 11.1C493.3-1.6 474.5-3.7 461 6.2L252.3 160H397.3L502.6 54.6c11.8-11.8 12.6-30.8 1.6-43.5zM32 192c-17.7 0-32 14.3-32 32s14.3 32 32 32c0 82.5 43.4 147.7 123.9 176.2c-11.1 13.9-19.4 30.3-23.9 48.1C127.6 497.4 142.3 512 160 512H352c17.7 0 32.4-14.6 28.1-31.7c-4.5-17.8-12.8-34.1-23.9-48.1C436.6 403.7 480 338.5 480 256c17.7 0 32-14.3 32-32s-14.3-32-32-32H32z",
  },
  {
    title: "No Trade-Offs, Just Pure Wellness",
    text: "You should never have to choose between natural and high-performance. At Bhumi Blend, we make sure you get both. Every product is crafted with authentic, results-driven formulations, so you experience the best of nature—without compromise.",
    // Lotus (spa)
    viewBox: "0 0 576 512",
    path: "M183.1 235.3c33.7 20.7 62.9 48.1 85.8 80.5c7 9.9 13.4 20.3 19.1 31c5.7-10.8 12.1-21.1 19.1-31c22.9-32.4 52.1-59.8 85.8-80.5C437.6 207.8 490.1 192 546 192h9.9c11.1 0 20.1 9 20.1 20.1C576 360.1 456.1 480 308.1 480H288 267.9C119.9 480 0 360.1 0 212.1C0 201 9 192 20.1 192H30c55.9 0 108.4 15.8 153.1 43.3zM301.5 37.6c15.7 16.9 61.1 71.8 84.4 164.6c-38 21.6-71.4 50.8-97.9 85.6c-26.5-34.8-59.9-63.9-97.9-85.6c23.2-92.8 68.6-147.7 84.4-164.6C278 33.9 282.9 32 288 32s10 1.9 13.5 5.6z",
  },
  {
    title: "Experience the Power of Real Ingredients",
    text: "Look for our High-Performance Botanical Seal—a mark of purity, potency, and perfection. It’s our promise that every product is packed with the best of nature, working to enhance your beauty, the way it was meant to be.",
    // Gem
    viewBox: "0 0 512 512",
    path: "M116.7 33.8c4.5-6.1 11.7-9.8 19.3-9.8H376c7.6 0 14.8 3.6 19.3 9.8l112 152c6.8 9.2 6.1 21.9-1.5 30.4l-232 256c-4.5 5-11 7.9-17.8 7.9s-13.2-2.9-17.8-7.9l-232-256c-7.7-8.5-8.3-21.2-1.5-30.4l112-152zm38.5 39.8c-3.3 2.5-4.2 7-2.1 10.5l57.4 95.6L63.3 192c-4.1 .3-7.3 3.8-7.3 8s3.2 7.6 7.3 8l192 16c.4 0 .9 0 1.3 0l192-16c4.1-.3 7.3-3.8 7.3-8s-3.2-7.6-7.3-8L301.5 179.8l57.4-95.6c2.1-3.5 1.2-8.1-2.1-10.5s-7.9-2-10.7 1L256 172.2 165.9 74.6c-2.8-3-7.4-3.4-10.7-1z",
  },
];

// White text on the pale photos needs a faint shadow to stay readable.
const onPhoto = "[text-shadow:0_1px_6px_rgba(130,85,10,0.4)]";

export default function OurFormulaPage() {
  return (
    <>
      <main>
        {/* ───────── Hero: golden-leaves photo with the headline ───────── */}
        <section className="relative flex min-h-[320px] items-center overflow-hidden bg-[#f7dba3] sm:min-h-[362px]">
          <Image
            src="/banerH.webp"
            alt=""
            fill
            sizes="100vw"
            loading="eager"
            fetchPriority="high"
            // A 160 KB webp: served as-is so it isn't re-compressed.
            unoptimized
            className="object-cover object-center"
          />
          <div className="relative mx-auto w-full max-w-[1348px] px-6 py-12">
            <div className="md:pl-[10%] lg:pl-[16%]">
              <p
                className={`font-sans text-[12px] leading-normal font-semibold tracking-[3px] text-white uppercase ${onPhoto}`}
              >
                Our Formula
              </p>
              <h1 className="mt-1 mb-3 font-serif text-[30px] leading-[1.2] font-medium text-[#222] sm:text-[40px]">
                Nature’s Best, Perfectly Blended
              </h1>
              <p
                className={`max-w-[700px] font-sans text-[15px] leading-[1.7] text-white ${onPhoto}`}
              >
                At Bhumi Blend, we believe in the power of pure, unaltered nature.{" "}
                <br className="hidden sm:block" />
                Our formulations are crafted with the finest natural ingredients,{" "}
                <br className="hidden sm:block" />
                bringing together the wisdom of Ayurveda and modern science to{" "}
                <br className="hidden sm:block" />
                deliver effective, safe, and toxin-free solutions for skin, hair, and body care.
              </p>
            </div>
          </div>
        </section>

        {/* ───────── Five promises: white cards with a gold hairline border ───────── */}
        <section aria-label="What goes into every product" className="bg-[#faf6ee]">
          <div className="mx-auto max-w-[1348px] px-6 pt-12 pb-14 sm:pt-[60px] sm:pb-16">
            <ul className="flex flex-wrap gap-5">
              {pillars.map((pillar) => (
                <li
                  key={pillar.title}
                  className="min-w-[220px] flex-1 border border-[#d6b36a] bg-white px-5 py-[30px] text-center transition-[transform,box-shadow] duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_25px_rgba(0,0,0,0.08)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                >
                  <svg
                    aria-hidden="true"
                    viewBox={pillar.viewBox}
                    className="mx-auto mb-[15px] h-8 w-auto fill-[#c8a24c]"
                  >
                    <path d={pillar.path} />
                  </svg>
                  <h2 className="mb-3 font-serif text-[18px] leading-normal font-bold text-[#333]">
                    {pillar.title}
                  </h2>
                  <p
                    className={`${montserrat.className} text-[14px] leading-[1.6] text-[#555]`}
                  >
                    {pillar.text}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ───────── What We Do Best: white flowers on the left, text on the right ───────── */}
        <section className="relative overflow-hidden bg-[#ede4c5]">
          {/* Phones/tablets: the flowers are a strip above the text. From 1280px
              they sit behind the section, anchored left. */}
          <div className="absolute inset-x-0 top-0 h-[200px] sm:h-[240px] xl:inset-y-0 xl:h-auto">
            <Image
              src="/baner-F-scaled.webp"
              alt=""
              fill
              sizes="100vw"
              // A 40 KB webp: served as-is so it isn't re-compressed.
              unoptimized
              className="object-cover object-left"
            />
          </div>
          {/* On mid-size desktops the flowers reach under the text; this veil fades them out
              behind the text column (it blends into the flat background on wide screens). */}
          <div
            aria-hidden="true"
            className="absolute inset-y-0 right-0 left-[38%] hidden bg-gradient-to-r from-transparent from-0% via-[#ede4c5]/90 via-35% to-[#ede4c5] xl:block"
          />

          <div className="relative mx-auto max-w-[1348px] px-6 pt-[224px] pb-10 sm:pt-[264px] xl:py-5">
            <div className="max-w-[700px] xl:ml-auto">
              <h2 className="mb-3 font-serif text-[26px] leading-[1.2] font-medium text-[#C89B3C] sm:text-[30px]">
                What We Do Best: Pure, Potent, and Powerful
              </h2>
              <div className="font-sans text-[15px] leading-[1.7] text-black">
                <p>
                  At <b>Bhumi Blend</b>, we believe in delivering more—more purity, more potency,
                  and more results. Our products are packed with the highest concentration of real,
                  natural ingredients; ensuring your skin, hair, and body receive the best of nature
                  without a drop of artificial chemicals.
                </p>
                <p className="mt-[1.7em]">
                  Crafted for those who seek visible results without compromise, our formulations
                  blend ancient Ayurvedic wisdom with modern science. Free from toxins, parabens,
                  and sulfates, every product is designed to heal, nourish, and rejuvenate
                  naturally.
                </p>
                <p className="mt-[1.7em]">
                  With Bhumi Blend, you never have to choose between nature and performance. Our
                  High-Performance Botanical Seal guarantees that every product is pure, effective,
                  and backed by the power of real ingredients.
                </p>
              </div>
              <p
                className={`mt-8 text-right font-sans text-[16px] leading-normal font-bold text-white ${onPhoto}`}
              >
                Bhumi Blend – Where Nature Meets Performance.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
