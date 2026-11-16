import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { ingredientsPage as page } from "@/data/ingredients";

export const metadata: Metadata = {
  title: "Ingredients & Benefits | Bhumi Blend Organics",
  description:
    "The Ayurvedic botanicals behind Bhumi Blend: Billy Goat plum, chamomile and sandalwood, and why we believe in Ayurvedic skin care.",
};

// Bolds `highlight` inside `text` (used for "Vitamin C").
function Highlighted({ text, highlight }: { text: string; highlight?: string }) {
  const at = highlight ? text.indexOf(highlight) : -1;
  if (!highlight || at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <strong className="font-semibold text-[#222]">{highlight}</strong>
      {text.slice(at + highlight.length)}
    </>
  );
}

function CheckIcon() {
  return (
    <span
      aria-hidden="true"
      className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white text-brand-gold-dark ring-1 ring-[#C89B3C]/55"
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="m5 12.5 4.5 4.5L19 7.5" />
      </svg>
    </span>
  );
}

export default function IngredientsBenefitsPage() {
  const { hero, ingredients, why } = page;

  return (
    <>
      <main>
        {/* ───────── Intro: centred text, then the photo as a wide rounded strip ───────── */}
        <section className="bg-brand-cream px-4 pt-0 pb-12 sm:px-6 md:pt-16 md:pb-16">
          <div className="mx-auto flex max-w-[1240px] flex-col">
            {/* Below 768px the photo comes first, edge to edge, and this text sits
                in a card overlapping its bottom. From 768px: centred text on
                top and the photo as a rounded strip below. */}
            <div className="relative z-10 order-2 mx-auto -mt-14 w-full max-w-[560px] rounded-2xl bg-white px-6 pt-8 pb-9 text-center shadow-[0_24px_50px_-28px_rgba(90,60,10,0.6)] ring-1 ring-[#C89B3C]/30 md:order-1 md:mt-0 md:max-w-[780px] md:rounded-none md:bg-transparent md:p-0 md:shadow-none md:ring-0">
              {/* The side lines are left out on phones, where the card is too narrow for them. */}
              <p className="flex items-center justify-center gap-3 font-sans text-[12px] font-semibold tracking-[3px] text-brand-gold-dark uppercase sm:text-[13px]">
                <span aria-hidden="true" className="hidden h-px w-8 bg-brand-gold sm:block" />
                {hero.eyebrow}
                <span aria-hidden="true" className="hidden h-px w-8 bg-brand-gold sm:block" />
              </p>
              <h1 className="mt-4 font-serif text-[32px] leading-[1.12] font-medium text-balance text-[#222] sm:mt-5 sm:text-[48px] lg:text-[58px]">
                {hero.heading}
              </h1>
              <span aria-hidden="true" className="mx-auto mt-6 block h-[3px] w-14 rounded-full bg-brand-gold" />
              <p className="mx-auto mt-6 max-w-[34em] font-system text-[16px] leading-7 text-[#4a4036] sm:text-[18px] sm:leading-8">
                {hero.text}
              </p>
              <Link
                href={hero.ctaHref}
                className="mt-8 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#e6bd62] to-[#C89B3C] px-10 py-3.5 font-sans text-[15px] font-semibold tracking-[0.12em] text-[#2a1a05] uppercase shadow-[0_14px_28px_-14px_rgba(184,121,31,0.85)] transition-[filter,transform] duration-300 hover:-translate-y-0.5 hover:brightness-105"
              >
                {hero.ctaLabel}
              </Link>
            </div>

            <div className="relative order-1 -mx-4 aspect-[4/3.4] overflow-hidden bg-[#3f3f32] sm:-mx-6 sm:aspect-[16/8] md:order-2 md:mx-0 md:mt-14 md:aspect-[2.4/1] md:rounded-3xl md:shadow-[0_30px_60px_-34px_rgba(90,60,10,0.6)] md:ring-1 md:ring-[#C89B3C]/30 lg:aspect-[3.9/1]">
              <Image
                src={hero.image}
                alt={hero.imageAlt}
                fill
                sizes="(min-width: 1280px) 1240px, 100vw"
                loading="eager"
                fetchPriority="high"
                // A 150 KB webp: served as-is so it isn't re-compressed.
                unoptimized
                // Anchored right so the flat dark left side of the file is
                // cropped off. Phones show a tall crop on the woman's face;
                // wider screens also keep the bottles in view.
                className="object-cover object-[88%_40%] md:object-[92%_50%] lg:object-[100%_50%]"
              />
            </div>
          </div>
        </section>

        {/* ───────── Core ingredients: numbered rows, photo and text swapping sides ───────── */}
        <section
          aria-labelledby="core-title"
          className="border-t border-[#efe5c9] bg-white py-16 md:py-24"
        >
          <div className="mx-auto max-w-[1240px] px-6">
            <div className="text-center">
              <h2
                id="core-title"
                className="font-serif text-[30px] leading-tight font-medium text-[#222] sm:text-[38px] md:text-[44px]"
              >
                {page.coreHeading}
              </h2>
              <span aria-hidden="true" className="mx-auto mt-5 block h-[3px] w-14 rounded-full bg-brand-gold" />
            </div>

            <ol className="mt-14 space-y-16 md:mt-20 md:space-y-24">
              {ingredients.map((item, index) => {
                const flip = index % 2 === 1;
                return (
                  <li
                    key={item.name}
                    className="grid items-center gap-9 lg:grid-cols-2 lg:gap-20"
                  >
                    {/* A thin gold frame sits offset behind the photo. */}
                    <div className={`relative ${flip ? "lg:order-2" : ""}`}>
                      <span
                        aria-hidden="true"
                        className={`absolute inset-0 translate-y-3 rounded-3xl border border-[#C89B3C]/60 ${
                          flip ? "-translate-x-3" : "translate-x-3"
                        }`}
                      />
                      <div className="relative aspect-[615/473] overflow-hidden rounded-3xl bg-[#f3ead3] shadow-[0_26px_50px_-30px_rgba(90,60,10,0.6)]">
                        <Image
                          src={item.image}
                          alt={item.imageAlt}
                          fill
                          sizes="(min-width: 1280px) 560px, (min-width: 1024px) 45vw, 100vw"
                          // 615px JPEGs: served as-is.
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                    </div>

                    <div className="max-w-[540px]">
                      <span
                        aria-hidden="true"
                        className="font-serif text-[64px] leading-none text-[#C89B3C]/45 sm:text-[84px]"
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <h3 className="mt-1 font-serif text-[30px] leading-tight font-medium text-[#222] sm:text-[38px]">
                        {item.name}
                      </h3>
                      <p className="mt-4 inline-block rounded-full border border-[#C89B3C]/55 bg-[#fbf4df] px-4 py-1.5 font-sans text-[12px] font-semibold tracking-[0.14em] text-brand-gold-dark uppercase sm:text-[13px]">
                        {item.benefit}
                      </p>
                      <p className="mt-5 font-system text-[16px] leading-8 text-[#4a4036] sm:text-[18px]">
                        <Highlighted text={item.text} highlight={item.highlight} />
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        {/* ───────── Why Ayurvedic skin care: cream panel, herbs along its right edge ───────── */}
        <section
          aria-labelledby="why-title"
          className="bg-brand-cream px-4 py-14 sm:px-6 md:py-20"
        >
          <div className="relative mx-auto max-w-[1240px] overflow-hidden rounded-3xl bg-[#efe5c4] ring-1 ring-[#C89B3C]/35">
            {/* Below 1024px: a strip of herbs above the text. From 1024px: the
                herbs sit at a fixed height in the panel's bottom-right corner
                (the file's own background matches the panel, so they blend),
                and the text column stops short of the bottles. */}
            <div className="relative h-[150px] sm:h-[200px] lg:hidden">
              <Image
                src={why.image}
                alt=""
                fill
                sizes="100vw"
                unoptimized
                className="object-cover object-right"
              />
            </div>
            <Image
              src={why.image}
              alt=""
              width={1500}
              height={282}
              sizes="1600px"
              unoptimized
              // The mask fades the file's top and left edges into the panel so
              // no lighter box shows where the picture ends.
              className="pointer-events-none absolute right-0 bottom-0 hidden h-[320px] w-auto max-w-none [mask-composite:intersect] [mask-image:linear-gradient(to_bottom,transparent_0%,#000_38%),linear-gradient(to_right,transparent_0%,#000_20%)] [-webkit-mask-composite:source-in] lg:block"
            />

            <div className="relative px-6 pt-8 pb-10 sm:px-10 lg:max-w-[54%] lg:py-16 lg:pl-16 xl:max-w-[700px]">
              <h2
                id="why-title"
                className="font-serif text-[30px] leading-tight font-medium text-[#222] sm:text-[38px]"
              >
                <span className="bg-gradient-to-r from-[#a96a12] to-[#d9a63f] bg-clip-text text-transparent">
                  {why.heading}
                </span>
              </h2>
              <p className="mt-3 font-system text-[16px] text-[#5f564a] sm:text-[17px]">{why.intro}</p>

              <ul className="mt-7 space-y-4">
                {why.points.map((point) => (
                  <li key={point.text} className="flex items-start gap-3.5">
                    <CheckIcon />
                    <span className="font-system text-[16px] leading-8 text-[#3b3226] sm:text-[18px]">
                      {point.lead && <strong className="font-semibold text-[#222]">{point.lead}</strong>}
                      {point.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
