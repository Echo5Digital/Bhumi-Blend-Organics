import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Our Story | Bhumi Blend Organics",
  description:
    "Bhumi Blend crafts skincare and haircare rooted in nature, wisdom and time-tested Ayurvedic traditions, sourced from Kerala.",
};

const iconProps = {
  "aria-hidden": true,
  viewBox: "0 0 24 24",
  className: "h-[22px] w-[22px] fill-none stroke-current",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function LeafIcon() {
  return (
    <svg {...iconProps}>
      <path d="M5 19c0-8.5 5.5-13.5 14-14 0 8.5-5 14-13.5 14" />
      <path d="M5 19c3-4.5 6.5-7.5 10-9.5" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}

function FlaskIcon() {
  return (
    <svg {...iconProps}>
      <path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3" />
      <path d="M7.5 14.5h9" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.6 2.6 4 5.6 4 9s-1.4 6.4-4 9c-2.6-2.6-4-5.6-4-9s1.4-6.4 4-9Z" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 3c.8 5.4 3.6 8.2 9 9-5.4.8-8.2 3.6-9 9-.8-5.4-3.6-8.2-9-9 5.4-.8 8.2-3.6 9-9Z" />
    </svg>
  );
}

const differences = [
  {
    title: "Rooted in Ayurveda, Perfected for Today",
    text: "Our formulations are inspired by centuries-old Ayurvedic traditions but crafted to meet the needs of the modern skincare enthusiast. We carefully blend herbal extracts, essential oils, and plant-based ingredients to create products that nourish, heal, and rejuvenate the skin and hair naturally.",
    icon: <LeafIcon />,
  },
  {
    title: "Sourced from Kerala, Made with Integrity",
    text: "We take pride in sourcing premium ingredients directly from Kerala, known for its rich biodiversity and medicinal herbs. Every Bhumi Blend product embodies the purity and potency of nature, free from harsh chemicals, parabens, sulfates, and synthetic fragrances.",
    icon: <PinIcon />,
  },
  {
    title: "Ayurveda Meets Science",
    text: "Unlike mass-market brands that rely heavily on artificial chemicals, our products are a synergy of Ayurvedic formulations and scientific advancements. This ensures that each product delivers optimal results while maintaining the skin’s natural balance.",
    icon: <FlaskIcon />,
  },
  {
    title: "Sustainability and Ethical Beauty",
    text: "We are committed to sustainability in every step of our process. Our ingredients are ethically sourced, and we prioritize eco-friendly packaging. Additionally, we never test on animals and ensure that our products are cruelty-free.",
    icon: <GlobeIcon />,
  },
  {
    title: "A Return to Authentic Skincare",
    text: "In a world where skincare has become dominated by synthetic formulas and misleading claims, Bhumi Blend offers a refreshing return to authenticity. Our products do not promise overnight miracles but instead work in harmony with your skin’s natural processes, bringing out your inherent glow over time.",
    icon: <SparkleIcon />,
  },
];

const eyebrowClass =
  "font-sans text-[12px] font-semibold tracking-[3px] text-brand-gold-dark uppercase sm:text-[13px]";
const bodyClass = "font-system text-[16px] leading-[1.85] text-[#4a4036] sm:text-[17px]";

function Divider() {
  return (
    <div aria-hidden="true" className="flex items-center justify-center gap-3">
      <span className="h-px w-14 bg-gradient-to-r from-transparent to-[#C89B3C]" />
      <span className="h-2 w-2 rotate-45 bg-[#C89B3C]" />
      <span className="h-px w-14 bg-gradient-to-l from-transparent to-[#C89B3C]" />
    </div>
  );
}

export default function OurStoryPage() {
  return (
    <>
      <main>
        {/* Hero: the title sits on the photo's own cream side from 1024px; on
            phones and tablets the photo (cropped to the model) is on top and
            the title is under it. */}
        <section className="relative isolate overflow-hidden bg-brand-cream lg:h-[clamp(350px,27vw,470px)]">
          <div className="relative aspect-[4/3] w-full sm:aspect-[2/1] lg:absolute lg:inset-0 lg:aspect-auto">
            <Image
              src="/baner-D-scaled.webp"
              alt="A smiling woman with long curly hair, lit by soft window light"
              fill
              sizes="100vw"
              loading="eager"
              fetchPriority="high"
              // A 40 KB WebP: served as-is so it isn't re-compressed.
              unoptimized
              className="object-cover object-[88%_30%] lg:object-right"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-brand-cream to-transparent lg:hidden"
            />
          </div>

          <div className="relative mx-auto max-w-[1290px] px-6 pt-4 pb-12 sm:pt-6 sm:pb-14 lg:flex lg:h-full lg:items-center lg:pt-0 lg:pb-0">
            <div className="w-full max-w-[600px] lg:max-w-[min(580px,48vw)]">
              <p className={eyebrowClass}>About Us</p>
              <h1 className="mt-3 font-serif text-[29px] leading-[1.18] font-medium text-[#222] sm:text-[38px] lg:text-[clamp(32px,3vw,46px)]">
                Crafting skincare rooted in nature, wisdom, and time-tested{" "}
                <span className="bg-gradient-to-r from-[#a96a12] to-[#d9a63f] bg-clip-text text-transparent">
                  Ayurvedic traditions
                </span>
              </h1>
              <span aria-hidden="true" className="mt-5 block h-[3px] w-14 rounded-full bg-brand-gold" />
            </div>
          </div>
        </section>

        {/* Who we are. */}
        <section className="bg-brand-cream">
          <div className="mx-auto grid max-w-[1160px] items-center gap-10 px-6 py-14 md:py-20 lg:grid-cols-[1fr_1.05fr] lg:gap-16 lg:py-24">
            <div className="relative aspect-[3/2] overflow-hidden rounded-[22px] shadow-[0_30px_60px_-34px_rgba(120,85,20,0.6)] ring-1 ring-[#C89B3C]/35">
              <Image
                src={encodeURI("/baner-A-scaled (1).webp")}
                alt="A woman with curly hair resting her head on her arm, a bottle of Bhumi Blend Botanical Hair Tonic by her shoulder"
                fill
                sizes="(min-width: 1024px) 560px, 100vw"
                // A 57 KB WebP: served as-is so it isn't re-compressed.
                unoptimized
                className="object-cover object-[78%_50%]"
              />
            </div>

            <div>
              <p className={eyebrowClass}>Bhumi Blend</p>
              <h2 className="mt-3 font-serif text-[27px] leading-[1.25] font-medium text-[#222] sm:text-[32px]">
                At Bhumi Blend, we believe that true beauty comes from nature’s wisdom.
              </h2>
              <span aria-hidden="true" className="mt-5 block h-[3px] w-14 rounded-full bg-brand-gold" />
              <p className={`mt-6 ${bodyClass}`}>
                Our journey began with a simple mission- to revive the time-honored secrets of
                Ayurveda and harmonize blend them with the advancements of modern skincare science.
              </p>
              <p className={`mt-4 ${bodyClass}`}>
                Rooted in the lush landscapes of Kerala, the heartland of Ayurveda, our products
                harness the healing power of nature to bring you a skincare experience that is pure,
                effective, and free from harmful chemicals.
              </p>
              <Link
                href="/shop"
                className="mt-8 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#e6bd62] to-[#C89B3C] px-9 py-3.5 font-sans text-[15px] font-semibold text-[#2a1a05] shadow-[0_14px_28px_-14px_rgba(184,121,31,0.85)] transition-[filter,transform] duration-300 hover:-translate-y-0.5 hover:brightness-105"
              >
                Shop Now
              </Link>
            </div>
          </div>
        </section>

        {/* Origins. */}
        <section className="border-y border-[#f0e8d2] bg-white">
          <div className="mx-auto max-w-[1160px] px-6 py-14 md:py-20 lg:py-24">
            <div className="mx-auto max-w-[760px] text-center">
              <p className={eyebrowClass}>The origins of Bhumi Blend</p>
              <h2 className="mt-3 font-serif text-[30px] leading-[1.2] font-medium text-[#222] sm:text-[40px]">
                Rooted in Ayurveda.{" "}
                <span className="bg-gradient-to-r from-[#a96a12] to-[#d9a63f] bg-clip-text text-transparent">
                  Refined for Today.
                </span>
              </h2>
              <div className="mt-6">
                <Divider />
              </div>
            </div>

            <div className="mt-10 grid gap-6 md:mt-12 md:grid-cols-2 md:gap-14">
              <p
                className={`${bodyClass} first-letter:float-left first-letter:mr-3 first-letter:font-serif first-letter:text-[68px] first-letter:leading-[0.82] first-letter:text-brand-gold`}
              >
                The origins of Bhumi Blend trace back to a deep appreciation for traditional Indian
                wellness practices. Inspired by age-old remedies passed down through families, we
                sought to bridge the gap between ancient wisdom and contemporary skincare needs.
                After years of research, collaboration with Ayurvedic experts, and sourcing the
                finest plant-based ingredients, Bhumi Blend was born — a brand that respects
                tradition while embracing innovation.
              </p>
              <p className={bodyClass}>
                Proud to be a brand that respects tradition while embracing innovation, we started
                in India, where Ayurveda has flourished for centuries, and now, we are on a mission
                to bring our unique formulations to the world. As we expand internationally, our
                goal remains the same: to provide skincare solutions that are plant based, gentle,
                effective, and deeply nourishing.
              </p>
            </div>
          </div>
        </section>

        {/* What makes us different: three cards over two, so the five fill the grid. */}
        <section className="bg-[linear-gradient(to_bottom,#ffffff_0%,#fcf6e6_30%,#f9efd6_75%,#ffffff_100%)]">
          <div className="mx-auto max-w-[1160px] px-6 py-14 md:py-20 lg:py-24">
            <div className="text-center">
              <h2 className="font-serif text-[30px] leading-[1.2] font-medium text-[#222] sm:text-[40px]">
                What Makes Us{" "}
                <span className="bg-gradient-to-r from-[#a96a12] to-[#d9a63f] bg-clip-text text-transparent">
                  Different?
                </span>
              </h2>
              <div className="mt-5">
                <Divider />
              </div>
            </div>

            <ul className="mt-10 grid gap-5 md:mt-14 md:grid-cols-2 md:gap-6 lg:grid-cols-6">
              {differences.map((item, index) => (
                <li
                  key={item.title}
                  className={`md:max-lg:last:col-span-2 ${index < 3 ? "lg:col-span-2" : "lg:col-span-3"}`}
                >
                  <article className="relative h-full rounded-[18px] bg-white px-6 pt-8 pb-7 shadow-[0_24px_44px_-30px_rgba(120,85,20,0.5)] ring-1 ring-[#C89B3C]/30 transition-[transform,box-shadow] duration-500 ease-out sm:px-8 [@media(hover:hover)]:hover:-translate-y-1 [@media(hover:hover)]:hover:shadow-[0_34px_56px_-30px_rgba(200,155,60,0.6)]">
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-8 top-0 h-[3px] rounded-b-full bg-gradient-to-r from-[#e6bd62] to-[#C89B3C]"
                    />
                    <span
                      aria-hidden="true"
                      className="grid h-12 w-12 place-items-center rounded-full bg-[#fbf3de] text-brand-gold-dark ring-1 ring-[#C89B3C]/45"
                    >
                      {item.icon}
                    </span>
                    <h3
                      className={`mt-5 font-serif text-[21px] leading-snug text-[#222] sm:text-[23px] ${index < 3 ? "lg:min-h-[2.75em]" : ""}`}
                    >
                      {item.title}
                    </h3>
                    <p className="mt-3 font-system text-[15px] leading-[1.8] text-[#4a4036] sm:text-[16px]">
                      {item.text}
                    </p>
                  </article>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* The range: skincare and haircare photos, each linking to its category. */}
        <section className="bg-brand-cream">
          <div className="mx-auto grid max-w-[1160px] items-center gap-12 px-6 py-14 md:py-20 lg:grid-cols-[0.95fr_1.25fr] lg:gap-14 lg:py-24">
            <div>
              <h2 className="font-serif text-[30px] leading-[1.2] font-medium text-[#222] sm:text-[40px]">
                Skincare &amp; Haircare{" "}
                <span className="bg-gradient-to-r from-[#a96a12] to-[#d9a63f] bg-clip-text text-transparent">
                  by Bhumi Blend
                </span>
              </h2>
              <span aria-hidden="true" className="mt-5 block h-[3px] w-14 rounded-full bg-brand-gold" />
              <p className="mt-6 font-serif text-[20px] leading-[1.55] text-[#2f2619] sm:text-[23px]">
                Our skincare and haircare range is designed for those who seek purity, performance,
                and the goodness of nature in every touch.
              </p>
              <p className={`mt-5 ${bodyClass}`}>
                Whether you’re looking to restore your skin’s radiance, strengthen your hair, or
                simply indulge in self-care the Ayurvedic way, Bhumi Blend is here to guide you on a
                journey back to nature.
              </p>
              <p className="mt-6 border-l-[3px] border-brand-gold pl-5 font-system text-[16px] leading-[1.85] text-[#4a4036] italic sm:text-[17px]">
                Join us in embracing the greatness of ancient remedies for modern beauty — because
                skincare should be as natural as the earth itself.
              </p>
            </div>

            {/* Two portrait photos. Phones: a swipeable pair, each ~78% wide with a peek
                of the next; from 640px they sit side by side, the second a little lower. */}
            <div className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pt-1 pb-9 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 sm:pt-0 sm:pb-0 [&::-webkit-scrollbar]:hidden">
              <Link
                href="/product-category/face"
                aria-label="Shop skin care"
                className="relative block aspect-[4/5] w-[78%] shrink-0 snap-center overflow-hidden rounded-[18px] sm:w-auto shadow-[0_30px_56px_-32px_rgba(120,85,20,0.6)] ring-1 ring-[#C89B3C]/35 sm:aspect-[4/5] sm:rounded-[24px]"
              >
                <Image
                  src="/box-design-1B-copy-S-1755x2048.webp"
                  alt="Bhumi Blend skin care: Vitamin C Face Serum, Revive + Under Eye Corrector, Radiance Elixir Brightening Gel and Anti-Ageing Cream on a mossy rock with saffron flowers and aloe"
                  fill
                  sizes="(min-width: 1024px) 28vw, 45vw"
                  className="object-cover object-bottom"
                />
              </Link>
              <Link
                href="/product-category/hair"
                aria-label="Shop hair care"
                className="relative block aspect-[4/5] w-[78%] shrink-0 snap-center overflow-hidden rounded-[18px] sm:w-auto shadow-[0_30px_56px_-32px_rgba(120,85,20,0.6)] ring-1 ring-[#C89B3C]/35 sm:mt-14 sm:aspect-[4/5] sm:rounded-[24px]"
              >
                <Image
                  src="/box-design-3B-copy-H-1755x2048.webp"
                  alt="Bhumi Blend hair care: Root Revival Hair Oil, Botanical Hair Tonic, Aloe Pure Shampoo and Pure Leaf Aloe Conditioner beside coconut, aloe, hibiscus and amla"
                  fill
                  sizes="(min-width: 1024px) 28vw, 45vw"
                  className="object-cover object-bottom"
                />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
