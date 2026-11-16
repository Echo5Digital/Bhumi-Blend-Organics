import Image from "next/image";
import Link from "next/link";
import type { IngredientsSection } from "@/data/categories";

// "Ingredients & Benefits": a centred heading, four photo cards with the
// ingredient's name and a line about it over the bottom of the photo, and an
// outline button to the full range. Static on purpose: the only motion is a
// slow zoom of the photo when a mouse hovers a card.
export function CategoryIngredients({ section }: { section: IngredientsSection }) {
  return (
    <section
      id="ingredients"
      aria-labelledby="ingredients-title"
      className="border-t border-[#efe5c9] bg-[#f8f4ea] py-14 md:py-20"
    >
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
        <div className="mx-auto max-w-[1000px] text-center">
          <p className="font-sans text-[12px] font-semibold tracking-[4px] text-brand-gold uppercase sm:text-[13px]">
            {section.eyebrow}
          </p>
          {/* text-balance: when it has to wrap, the two lines come out even
              instead of leaving one word alone on the second. */}
          <h2
            id="ingredients-title"
            className="mt-4 font-serif text-[28px] leading-tight font-medium text-balance text-[#222] sm:text-[34px] md:text-[40px]"
          >
            {section.heading}
          </h2>
          <span
            aria-hidden="true"
            className="mx-auto mt-5 block h-[3px] w-14 rounded-full bg-brand-gold"
          />
          <p className="mx-auto mt-6 max-w-[760px] font-system text-[15px] leading-7 text-[#5f564a] sm:text-[17px] sm:leading-8">
            {section.intro}
          </p>
        </div>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-5 md:mt-14 lg:grid-cols-4">
          {section.items.map((item) => (
            <li key={item.name}>
              <article className="group relative isolate aspect-[4/3.6] overflow-hidden rounded-2xl bg-[#e9e1cf] shadow-[0_18px_36px_-22px_rgba(90,60,10,0.55)] sm:aspect-[4/4.2] lg:aspect-[4/5]">
                <Image
                  src={item.image}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 290px, (min-width: 640px) 50vw, 100vw"
                  className="-z-10 object-cover transition-transform duration-[1200ms] ease-out [@media(hover:hover)]:group-hover:scale-[1.06]"
                />
                {/* Dark warm fade at the bottom so the white text reads on any photo. */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_top,rgba(28,20,11,0.92)_0%,rgba(28,20,11,0.72)_34%,rgba(28,20,11,0.26)_64%,rgba(28,20,11,0.14)_100%)]"
                />

                <div className="absolute inset-x-0 bottom-0 px-5 pt-6 pb-6 text-center sm:px-6">
                  <h3 className="font-serif text-[24px] leading-tight font-medium text-white sm:text-[26px]">
                    {item.name}
                  </h3>
                  <span
                    aria-hidden="true"
                    className="mx-auto mt-3 block h-px w-9 bg-[#e0b552] transition-[width] duration-500 [@media(hover:hover)]:group-hover:w-16"
                  />
                  <p className="mt-3 font-system text-[14.5px] leading-[1.65] text-white/90 [text-shadow:0_1px_8px_rgba(0,0,0,0.35)]">
                    {item.text}
                  </p>
                </div>
              </article>
            </li>
          ))}
        </ul>

        <div className="mt-10 text-center md:mt-12">
          <Link
            href={section.ctaHref}
            className="inline-flex items-center justify-center rounded-full border border-brand-gold px-8 py-3 font-sans text-[15px] font-semibold text-brand-gold-dark transition-colors duration-300 hover:bg-brand-gold hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold"
          >
            {section.ctaLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
