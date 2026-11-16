import Link from "next/link";
import type { WhyChooseSection } from "@/data/categories";

// Line icons for the four promises (drawn white, on a gold badge).
const icons: Record<WhyChooseSection["items"][number]["icon"], React.ReactNode> = {
  leaf: (
    <>
      <path d="M5 19c0-8 5-13.5 14-14.5 0 9-5.2 14.5-13.2 14.5" />
      <path d="M5 19c3-5 6-8 10-10" />
    </>
  ),
  sprout: (
    <>
      <path d="M12 21v-8" />
      <path d="M12 13c0-4-3-6-7.5-6 0 4 3 6 7.5 6Z" />
      <path d="M12 15.5c0-3.5 2.5-6 7.5-6 0 3.5-2.5 6-7.5 6Z" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6l7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  sparkle: (
    <>
      <path d="M11 3.5l1.9 5.6 5.6 1.9-5.6 1.9L11 18.5l-1.9-5.6L3.5 11l5.6-1.9L11 3.5Z" />
      <path d="M18.5 15.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2Z" />
    </>
  ),
};

// "Why Choose Bhumi Blend". Desktop: the heading, text and a gold button on
// the left, a staggered 2x2 grid of cards on the right. Phones: the heading,
// then the four promises as compact rows. Each card has a solid gold icon
// badge, a faint gold number and a gold hairline along its top edge. Static.
export function CategoryWhyChoose({ section }: { section: WhyChooseSection }) {
  return (
    <section
      id="why-choose"
      aria-labelledby="why-choose-title"
      className="relative isolate overflow-hidden border-t border-[#efe5c9] bg-[#f8f4ea] py-16 md:py-24"
    >
      {/* A soft gold glow behind the heading block. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -left-32 -z-10 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(224,181,82,0.22),transparent_66%)]"
      />

      <div className="mx-auto grid max-w-[1240px] items-center gap-12 px-4 sm:px-6 xl:grid-cols-[minmax(0,11fr)_minmax(0,13fr)] xl:gap-16">
        <div>
          <p className="flex items-center gap-3 font-sans text-[12px] font-semibold tracking-[3px] text-brand-gold-dark uppercase sm:text-[13px]">
            <span aria-hidden="true" className="h-px w-8 bg-brand-gold" />
            {section.eyebrow}
          </p>
          <h2
            id="why-choose-title"
            className="mt-5 font-serif text-[32px] leading-[1.12] font-medium text-[#222] sm:text-[42px] lg:text-[48px] xl:text-[clamp(40px,3.4vw,52px)]"
          >
            {section.heading}
            <span className="block bg-gradient-to-r from-[#a96a12] to-[#d9a63f] bg-clip-text text-transparent">
              {section.headingAccent}
            </span>
          </h2>
          <span aria-hidden="true" className="mt-6 block h-[3px] w-14 rounded-full bg-brand-gold" />
          <p className="mt-6 max-w-[30em] font-system text-[16px] leading-7 text-[#5f564a] sm:text-[17px] sm:leading-8">
            {section.intro}
          </p>
          <Link
            href={section.ctaHref}
            className="group mt-8 inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-[#e6bd62] to-[#C89B3C] px-8 py-3.5 font-sans text-[15px] font-semibold text-[#2a1a05] shadow-[0_14px_28px_-14px_rgba(184,121,31,0.85)] transition-[filter,transform] duration-300 hover:-translate-y-0.5 hover:brightness-105"
          >
            {section.ctaLabel}
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-4 w-4 fill-none stroke-current transition-transform duration-300 group-hover:translate-x-0.5"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>

        {/* From 640px the second column of cards sits 2rem lower, and the list
            gets matching space at the bottom so nothing is cut off. */}
        <ul className="grid gap-4 sm:grid-cols-2 sm:gap-5 sm:pb-8">
          {section.items.map((item, index) => (
            <li key={item.title} className={index % 2 === 1 ? "sm:translate-y-8" : ""}>
              <article className="relative flex h-full gap-4 overflow-hidden rounded-2xl bg-white p-5 shadow-[0_22px_44px_-30px_rgba(90,60,10,0.55)] ring-1 ring-[#C89B3C]/25 before:absolute before:inset-x-6 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-[#C89B3C] before:to-transparent sm:flex-col sm:gap-0 sm:p-7">
                <span
                  aria-hidden="true"
                  className="absolute top-3 right-4 font-serif text-[34px] leading-none text-[#C89B3C]/25 sm:top-5 sm:right-6 sm:text-[46px]"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>

                <span
                  aria-hidden="true"
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[linear-gradient(145deg,#f3d890_0%,#d9a63f_48%,#b8791f_100%)] text-white shadow-[0_12px_22px_-12px_rgba(184,121,31,0.9)] sm:h-14 sm:w-14 sm:rounded-2xl"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-6 w-6 fill-none stroke-current sm:h-7 sm:w-7"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {icons[item.icon]}
                  </svg>
                </span>

                <div className="min-w-0 pr-9 sm:mt-6 sm:pr-0">
                  <h3 className="font-serif text-[18px] leading-snug font-medium text-[#222] sm:text-[21px]">
                    {item.title}
                  </h3>
                  <p className="mt-2 font-system text-[14.5px] leading-[1.7] text-[#6b6257] sm:mt-3">
                    {item.text}
                  </p>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
