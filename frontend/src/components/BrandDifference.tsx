import Link from "next/link";
import { Reveal } from "@/components/Reveal";

// Wording and order are the ones on the live bhumiblend.com.
const pillars = [
  {
    title: "Rooted in Ayurveda",
    text: "Time-honored ingredients inspired by traditional wellness rituals.",
    href: "/our-story",
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
    href: "/our-formula",
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
    href: "/ingredients-benefits",
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
      className="bg-[radial-gradient(70%_45%_at_50%_0%,rgba(233,201,122,0.20)_0%,rgba(233,201,122,0)_100%),linear-gradient(to_bottom,#fffdf6_0%,#ffffff_100%)]"
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
            The card is a 1px gold-gradient frame around a white panel; the icon sits
            inside it, in a champagne halo, with a small gold tab hanging from the top edge. */}
        <ul className="mx-auto mt-14 grid max-w-[480px] gap-y-8 md:mt-16 lg:max-w-none lg:grid-cols-3 lg:gap-x-8">
          {pillars.map((pillar, index) => (
            <li key={pillar.title}>
              <Reveal delay={index * 120} className="h-full">
                <article className="group relative h-full rounded-[30px] bg-[linear-gradient(160deg,#ecd08a_0%,#f7edd3_38%,#e2bd62_100%)] p-px shadow-[0_26px_50px_-30px_rgba(120,85,20,0.5)] transition-[transform,box-shadow] duration-300 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-4 has-[a:focus-visible]:outline-[#C89B3C] hover:-translate-y-1.5 hover:shadow-[0_34px_60px_-28px_rgba(200,155,60,0.65)]">
                  <div className="relative flex h-full flex-col items-center overflow-hidden rounded-[29px] bg-white px-7 pt-11 pb-9 text-center lg:px-8">
                    {/* Soft champagne glow behind the icon, fading out down the card. */}
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(75%_100%_at_50%_0%,#fdf1d3_0%,rgba(255,255,255,0)_100%)]"
                    />
                    {/* Gold tab hanging from the top edge. */}
                    <span
                      aria-hidden="true"
                      className="absolute top-0 left-1/2 h-[4px] w-16 -translate-x-1/2 rounded-b-full bg-gradient-to-r from-[#d9a63f] via-[#f1d48b] to-[#d9a63f]"
                    />

                    {/* Icon: gold disc, white ring, champagne halo. */}
                    <span
                      aria-hidden="true"
                      className="relative grid h-[104px] w-[104px] place-items-center rounded-full bg-[#fbefcf]/70 ring-1 ring-[#C89B3C]/30"
                    >
                      <span className="grid h-[76px] w-[76px] place-items-center rounded-full bg-[linear-gradient(145deg,#f3d890_0%,#d9a63f_45%,#b8791f_100%)] text-white shadow-[0_14px_26px_-10px_rgba(150,100,20,0.65)] ring-[5px] ring-white transition-transform duration-300 group-hover:scale-105">
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
                    </span>

                    <h3 className="relative mt-7 font-serif text-[22px] leading-snug text-[#222] lg:text-[24px]">
                      {pillar.title}
                    </h3>
                    <span
                      aria-hidden="true"
                      className="relative mt-4 flex items-center justify-center gap-2"
                    >
                      <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#C89B3C]" />
                      <span className="h-1.5 w-1.5 rotate-45 bg-[#C89B3C]" />
                      <span className="h-px w-8 bg-gradient-to-l from-transparent to-[#C89B3C]" />
                    </span>
                    <p className="relative mx-auto mt-4 max-w-[300px] font-sans text-[14.5px] leading-7 text-[#5f5e5e]">
                      {pillar.text}
                    </p>

                    {/* mt-auto keeps the three links on one line when the texts differ in length. */}
                    <Link
                      href={pillar.href}
                      className="mt-auto inline-flex items-center gap-2.5 pt-7 font-sans text-[13.5px] font-semibold tracking-wide text-[#96661a] outline-none after:absolute after:inset-0 after:rounded-[29px] after:content-['']"
                    >
                      <span className="border-b border-transparent pb-px transition-colors duration-300 group-hover:border-[#C89B3C]">
                        Read more
                      </span>
                      <span
                        aria-hidden="true"
                        className="grid h-7 w-7 place-items-center rounded-full border border-[#C89B3C]/60 text-[13px] leading-none transition-colors duration-300 group-hover:border-[#C89B3C] group-hover:bg-[#C89B3C] group-hover:text-white"
                      >
                        →
                      </span>
                    </Link>
                  </div>
                </article>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
