import Link from "next/link";
import { Reveal } from "@/components/Reveal";

// Wording and order are the ones on the live bhumiblend.com.
const pillars = [
  {
    title: "Rooted in Ayurveda",
    text: "Time-honored ingredients inspired by traditional wellness rituals.",
    href: "/#about",
    // Leaf
    icon: (
      <>
        <path d="M5 19C5 10.5 10.5 5 19 5c0 8.5-5.5 14-14 14Z" />
        <path d="M5 19 13.5 10.5" />
      </>
    ),
  },
  {
    title: "Plant-Based & Gentle",
    text: "Carefully selected botanical ingredients with a focus on purity and balance.",
    href: "/#about",
    // Sprout
    icon: (
      <>
        <path d="M12 21v-9" />
        <path d="M12 13.5c-4.2 0-6.5-2.3-6.5-6.5 4.2 0 6.5 2.3 6.5 6.5Z" />
        <path d="M12 11.5c0-4.2 2.3-6.5 6.5-6.5 0 4.2-2.3 6.5-6.5 6.5Z" />
      </>
    ),
  },
  {
    title: "Crafted for Daily Rituals",
    text: "Designed to turn everyday skin and hair care into a calming self-care experience.",
    href: "/#about",
    // Sunrise
    icon: (
      <>
        <path d="M3 19h18" />
        <path d="M7 19a5 5 0 0 1 10 0" />
        <path d="M12 6v2.5M5.4 9.4l1.7 1.7M18.6 9.4l-1.7 1.7" />
      </>
    ),
  },
];

export function BrandDifference() {
  return (
    <section
      id="difference"
      aria-labelledby="difference-title"
      className="bg-[linear-gradient(to_bottom,#fcfcf5_0%,#ffffff_100%)]"
    >
      <div className="mx-auto max-w-[1180px] px-6 pt-20 pb-24 md:pt-24 md:pb-28">
        <Reveal>
          <div className="text-center">
            <p className="mb-3 font-sans text-[12px] font-semibold tracking-[3px] text-[#C89B3C] uppercase">
              The Bhumi Blend Difference
            </p>
            <h2
              id="difference-title"
              className="font-serif text-[32px] leading-tight font-medium text-[#222] sm:text-[40px] lg:text-[46px]"
            >
              Nature, Ritual,{" "}
              <span className="bg-gradient-to-r from-[#a96a12] to-[#d9a63f] bg-clip-text text-transparent">
                Results
              </span>
            </h2>
            <div aria-hidden="true" className="mt-5 flex items-center justify-center gap-3">
              <span className="h-px w-12 bg-gradient-to-r from-transparent to-[#C89B3C]" />
              <span className="h-2 w-2 rotate-45 bg-[#C89B3C]" />
              <span className="h-px w-12 bg-gradient-to-l from-transparent to-[#C89B3C]" />
            </div>
            <p className="mx-auto mt-6 max-w-[740px] font-sans text-[15px] text-balance leading-7 text-[#5f5e5e] sm:text-[16px] sm:leading-8">
              Our formulations are inspired by Ayurvedic wisdom and crafted to bring purity,
              nourishment, and balance to your everyday beauty routine.
            </p>
          </div>
        </Reveal>

        {/* Each card is one big link (the "Read more" link is stretched over it).
            The medallion sits on the top edge, so leave room above it. */}
        <ul className="mx-auto mt-20 grid max-w-[480px] gap-y-20 md:mt-24 lg:max-w-none lg:grid-cols-3 lg:gap-x-10">
          {pillars.map((pillar, index) => (
            <li key={pillar.title}>
              <Reveal delay={index * 120} className="h-full">
                <article className="group relative h-full rounded-3xl border border-[#C89B3C]/40 bg-gradient-to-b from-[#fffaf0] to-white px-7 pt-16 pb-9 text-center shadow-[0_22px_48px_-30px_rgba(120,85,20,0.45)] transition-[transform,box-shadow,border-color] duration-300 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-4 has-[a:focus-visible]:outline-[#C89B3C] hover:-translate-y-1 hover:border-[#C89B3C] hover:shadow-[0_30px_56px_-28px_rgba(200,155,60,0.6)] lg:px-8">
                  {/* Medallion: solid gold disc with a white ring. */}
                  <span
                    aria-hidden="true"
                    className="absolute top-0 left-1/2 grid h-[76px] w-[76px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[linear-gradient(145deg,#f3d890_0%,#d9a63f_45%,#b8791f_100%)] text-white shadow-[0_14px_28px_-10px_rgba(150,100,20,0.6)] ring-[5px] ring-white"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-9 w-9 fill-none stroke-current"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {pillar.icon}
                    </svg>
                  </span>

                  <h3 className="font-serif text-[22px] leading-snug text-[#222] lg:text-[24px]">
                    {pillar.title}
                  </h3>
                  <span
                    aria-hidden="true"
                    className="mx-auto mt-3 block h-px w-10 bg-[#C89B3C]"
                  />
                  <p className="mx-auto mt-4 max-w-[300px] font-sans text-[14.5px] leading-7 text-[#5f5e5e]">
                    {pillar.text}
                  </p>

                  <Link
                    href={pillar.href}
                    className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#C89B3C]/60 px-5 py-2 font-sans text-[13.5px] font-semibold tracking-wide text-[#96661a] outline-none transition-colors duration-300 after:absolute after:inset-0 after:rounded-3xl after:content-[''] group-hover:border-[#C89B3C] group-hover:bg-[#C89B3C] group-hover:text-white"
                  >
                    Read more
                    <span aria-hidden="true">→</span>
                  </Link>
                </article>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
