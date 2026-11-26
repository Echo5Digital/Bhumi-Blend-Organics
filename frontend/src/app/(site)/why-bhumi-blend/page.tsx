import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Why Bhumi Blend | Bhumi Blend Organics",
  description:
    "Welcome to Bhumi Blend, where the wisdom of ancient Kerala meets the sophistication of modern beauty trends.",
};

// A standalone page: nothing on the site links to it, it is reached by its address,
// /why-bhumi-blend. Wording and order are the ones on the live page.

const rowHeading = "font-serif text-[26px] leading-[1.2] font-bold text-[#2f2f2f] sm:text-[34px]";
const rowText = "font-system text-[16px] leading-[1.7] text-[#3b3b3b]";
// A row's photo fills its half of the row (549px on a wide screen) at its own proportions.
const rowImage = "h-auto w-full";
const rowImageSizes = "(min-width: 1024px) 549px, 100vw";

export default function WhyBhumiBlendPage() {
  return (
    <>
      <main className="bg-brand-cream">
        {/* ───────── Title band ───────── */}
        <section className="flex min-h-[140px] items-center justify-center bg-[#fbf3dd] px-6 sm:min-h-[198px]">
          <h1 className="text-center font-serif text-[30px] leading-[1.2] font-bold text-brand-gold-dark sm:text-[38px]">
            Why Bhumi Blend
          </h1>
        </section>

        <div className="px-4 pt-10 pb-12 sm:px-6 sm:pt-20 sm:pb-20">
          <div className="mx-auto max-w-[1242px] bg-white p-4 sm:p-8">
            {/* ───────── Herbs on marble, with the intro card ───────── */}
            <section className="relative">
              <div className="relative aspect-3/2 overflow-hidden lg:aspect-1178/710">
                <Image
                  src="/bg_bb.jpg"
                  alt=""
                  fill
                  sizes="(min-width: 1242px) 1178px, 100vw"
                  loading="eager"
                  fetchPriority="high"
                  // A cropped photo: served as-is so the crop stays sharp.
                  unoptimized
                  className="object-cover object-top"
                />
              </div>
              <div className="relative z-10 mx-3 -mt-10 bg-white px-6 py-7 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)] sm:mx-6 sm:px-10 sm:py-9 lg:absolute lg:top-1/2 lg:left-5 lg:mx-0 lg:mt-0 lg:w-[48.4%] lg:-translate-y-1/2 lg:shadow-none">
                <h2 className="font-serif text-[20px] leading-[1.3] font-bold text-brand-gold-dark">
                  Why Bhumi Blend
                </h2>
                <p className="mt-4 font-system text-[15px] leading-[1.6] text-[#3b3b3b]">
                  Welcome to Bhumi Blend, where the wisdom of ancient Kerala meets the sophistication of modern
                  beauty trends. We have created a line of personal care and beauty products that highlight the
                  potency and purity of locally grown, plant-based ingredients, drawing inspiration from the natural
                  and Ayurvedic beauty secrets that have been passed down through the generations. At Bhumi Blend,
                  we believe in harnessing the power of nature to nurture your skin and hair, paying homage to the
                  timeless traditions of our mothers and grandmothers.
                </p>
              </div>
            </section>

            {/* ───────── Real Ingredients, No Extracts ───────── */}
            <section className="grid items-center gap-6 py-10 lg:grid-cols-2 lg:gap-5 lg:px-[30px] lg:py-[50px]">
              <div>
                <h2 className={rowHeading}>Real Ingredients, No Extracts</h2>
                <p className={`mt-5 ${rowText}`}>
                  We use whole, natural ingredients in their purest form—no shortcuts, no artificial extracts. This
                  ensures that every product retains the full potency of nature, delivering deep nourishment and
                  lasting benefits for your skin and hair.
                </p>
              </div>
              <Image
                src="/Palmoil_BB.jpg"
                alt="Red palm fruits, two of them cut open"
                width={658}
                height={494}
                sizes={rowImageSizes}
                className={rowImage}
              />
            </section>

            {/* ───────── Our Formula: golden panel with a white card ───────── */}
            <section className="relative flex items-center justify-center overflow-hidden bg-[#f7dba3] px-4 py-10 sm:py-20">
              <Image
                src="/about_bg_1.jpg"
                alt=""
                fill
                sizes="(min-width: 1242px) 1178px, 100vw"
                // A cropped photo: served as-is so the crop stays sharp.
                unoptimized
                className="object-cover object-center"
              />
              <div className="relative w-full max-w-[683px] bg-white px-6 py-10 sm:px-10 sm:py-20">
                <h2 className="font-serif text-[26px] leading-[1.15] font-bold text-[#2f2f2f] sm:text-[32px]">
                  Our Formula: Nature’s Best, Perfectly Blended
                </h2>
                <p className="mt-5 font-system text-[16px] leading-[1.7] text-[#3b3b3b]">
                  At Bhumi Blend, we believe in the power of pure, unaltered nature. Our formulations are crafted with
                  the finest natural ingredients, bringing together the wisdom of Ayurveda and modern science to
                  deliver effective, safe, and toxin-free solutions for skin, hair, and body care.
                </p>
                <Link
                  href="/our-formula"
                  className="mt-3 inline-block border-b border-brand-gold-dark pb-px font-system text-[15px] text-brand-gold-dark transition-colors duration-300 hover:border-[#8f6414] hover:text-[#8f6414] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-gold"
                >
                  View More
                </Link>
              </div>
            </section>

            {/* ───────── Ayurveda Meets Modern Science: leaf on the left ───────── */}
            <section className="grid items-center gap-6 bg-[#faf6ee] px-4 py-10 lg:grid-cols-2 lg:gap-5 lg:px-[30px] lg:py-[50px]">
              <Image
                src="/BB_abtus1.jpg"
                alt="Fresh green leaves"
                width={580}
                height={520}
                sizes={rowImageSizes}
                className={rowImage}
              />
              <div>
                <h2 className={rowHeading}>Ayurveda Meets Modern Science</h2>
                <p className={`mt-5 ${rowText}`}>
                  Our products are crafted by blending time-honored Ayurvedic wisdom with advanced scientific
                  research. This fusion ensures effective, safe, and well-balanced formulations that cater to modern
                  skincare and wellness needs while staying true to Ayurvedic principles.
                </p>
              </div>
            </section>

            {/* ───────── No Parabens, No Sulfates, No Artificial Fragrance ───────── */}
            <section className="grid items-center gap-6 py-10 lg:grid-cols-2 lg:gap-5 lg:px-[30px] lg:py-[50px]">
              <div>
                <h2 className={rowHeading}>No Parabens, No Sulfates, No Artificial Fragrance</h2>
                <p className={`mt-5 ${rowText}`}>
                  We are committed to clean beauty. Our formulations are free from harsh chemicals, parabens,
                  sulfates, and artificial fragrances, ensuring gentle and toxin-free care that’s safe for all skin
                  types, including sensitive skin.
                </p>
                <p className={`mt-6 ${rowText}`}>
                  Experience the purity of nature with Bhumi Blend—where tradition meets innovation for your
                  wellness.
                </p>
              </div>
              <Image
                src="/BB_abtus.jpg"
                alt="Yellow flower petals"
                width={650}
                height={500}
                sizes={rowImageSizes}
                className={rowImage}
              />
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
