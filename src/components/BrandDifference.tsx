import Image from "next/image";
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
    <section id="difference" className="relative isolate overflow-hidden bg-brand-cream">
      {/* Background photo — decorative, so no alt text. On narrow screens the
          section is tall, so anchor the crop to the herbs on the left. */}
      <div aria-hidden="true" className="absolute inset-0 -z-20">
        <Image
          src="/bhumiblend.jpeg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-[12%_50%] md:object-center"
        />
      </div>

      {/* Veils: melt the photo into the cream section above and the white one
          below, and keep a soft bright pool behind the text so it stays legible. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,#fcfcf5_0%,rgba(252,252,245,0)_24%,rgba(255,255,255,0)_84%,#fff_100%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_55%_at_50%_42%,rgba(255,255,252,0.7),transparent)]"
      />

      <div className="mx-auto max-w-[1180px] px-6 pt-16 pb-20 md:pt-20 md:pb-28">
        <Reveal>
          <div className="text-center">
            <p className="mb-3 font-sans text-[12px] font-semibold tracking-[3px] text-[#C89B3C] uppercase">
              The Bhumi Blend Difference
            </p>
            <h2 className="font-serif text-[30px] font-medium text-[#222] sm:text-[38px]">
              Nature, Ritual, Results
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
            Top padding leaves room for the medallion that straddles the edge. */}
        <ul className="mt-20 grid gap-x-8 gap-y-16 md:mt-24 md:grid-cols-3 lg:gap-x-10">
          {pillars.map((pillar, index) => (
            <li key={pillar.title}>
              <Reveal delay={index * 120} className="h-full">
                <article className="group relative h-full rounded-[28px] border border-white/80 bg-white/75 px-7 md:bg-white/60 pt-16 pb-9 text-center shadow-[0_26px_60px_-34px_rgba(90,70,20,0.5)] backdrop-blur-md transition-[transform,box-shadow,background-color,border-color] duration-500 ease-out before:pointer-events-none before:absolute before:inset-2 before:rounded-[21px] before:border before:border-[#C89B3C]/25 before:transition-colors before:duration-500 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-4 has-[a:focus-visible]:outline-[#C89B3C] [@media(hover:hover)]:hover:-translate-y-2 [@media(hover:hover)]:hover:border-[#C89B3C]/60 [@media(hover:hover)]:hover:bg-white/80 [@media(hover:hover)]:hover:shadow-[0_36px_70px_-30px_rgba(200,155,60,0.6)] [@media(hover:hover)]:hover:before:border-[#C89B3C]/55 md:px-8 lg:px-10">
                  {/* Medallion: icon in a gold-ringed disc with a faint outer halo. */}
                  <span
                    aria-hidden="true"
                    className="absolute top-0 left-1/2 grid h-[72px] w-[72px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-gradient-to-br from-white to-[#f7ecd0] text-[#C89B3C] shadow-[0_12px_26px_-10px_rgba(150,110,30,0.55)] ring-1 ring-[#C89B3C]/60 ring-offset-[6px] ring-offset-white/70 transition-colors duration-500 group-hover:from-[#d8aa4c] group-hover:to-[#C89B3C] group-hover:text-white"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-10 w-10 fill-none stroke-current"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {pillar.icon}
                    </svg>
                  </span>

                  <h3 className="relative font-serif text-[22px] leading-snug text-[#222] lg:text-[24px]">
                    {pillar.title}
                  </h3>
                  <span
                    aria-hidden="true"
                    className="relative mx-auto mt-3 block h-px w-8 bg-[#C89B3C] transition-all duration-500 group-hover:w-16"
                  />
                  <p className="relative mx-auto mt-4 max-w-[300px] font-sans text-[14.5px] leading-7 text-[#5f5e5e]">
                    {pillar.text}
                  </p>

                  <Link
                    href={pillar.href}
                    className="mt-6 inline-flex items-center gap-1.5 font-sans text-[14px] font-semibold tracking-wide text-[#96661a] outline-none after:absolute after:inset-0 after:rounded-[28px] after:content-[''] hover:text-[#7a5212]"
                  >
                    Read more
                    <span
                      aria-hidden="true"
                      className="inline-block transition-transform duration-500 ease-out group-hover:translate-x-1.5"
                    >
                      →
                    </span>
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
