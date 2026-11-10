import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";

// Wording, order and links are the ones on the live bhumiblend.com.
const concerns = [
  {
    name: "Hair Care",
    description: "Stronger, healthier hair",
    href: "/product-category/hair",
    image: "/hair-510x640.jpg",
  },
  {
    name: "Skin Care",
    description: "Clear, glowing skin",
    href: "/product-category/face",
    image: "/skin-510x640.jpg",
  },
  {
    name: "Body Care",
    description: "Deep nourishment for your skin",
    href: "/product-category/body",
    image: "/body-510x640.jpg",
  },
  {
    name: "Combos & Kits",
    description: "Complete care routines",
    href: "/product-category/combo",
    image: "/combo-510x640.jpg",
  },
];

// Arch: fully round top (radius = half the width, which is 40% of a 4:5 card's
// height) and softly rounded bottom corners.
const arch = "rounded-[50%_50%_24px_24px/40%_40%_24px_24px]";

export function ShopByConcern() {
  return (
    <section id="categories" className="relative overflow-hidden bg-brand-cream">
      {/* Soft gold glows for depth */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -left-32 h-[28rem] w-[28rem] rounded-full bg-[#C89B3C]/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 bottom-0 h-[26rem] w-[26rem] rounded-full bg-[#C89B3C]/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-[1290px] px-6 pt-12 pb-24 md:pb-28">
        {/* Heading — same wording and type as the live site. */}
        <div className="px-5 pt-5 pb-10 text-center">
          <p className="mb-3 font-sans text-[12px] font-semibold tracking-[3px] text-[#C89B3C] uppercase">
            Discover Your Routine
          </p>
          <h2 className="font-serif text-[30px] font-medium text-[#222] sm:text-[38px]">
            Shop by Concern
          </h2>
          <p className="mx-auto mt-2.5 max-w-[600px] font-sans text-[15px] text-[#777]">
            Find the perfect solution for your skin and hair needs
          </p>
          <div aria-hidden="true" className="mt-6 flex items-center justify-center gap-3">
            <span className="h-px w-14 bg-gradient-to-r from-transparent to-[#C89B3C]" />
            <span className="h-2 w-2 rotate-45 bg-[#C89B3C]" />
            <span className="h-px w-14 bg-gradient-to-l from-transparent to-[#C89B3C]" />
          </div>
        </div>

        {/* 2 columns on phones/tablets, 4 on desktop. Every second card sits
            lower, so the row reads as a gentle wave. */}
        <div className="grid grid-cols-2 items-start gap-x-6 gap-y-14 lg:grid-cols-4 lg:gap-x-9 [&>*:nth-child(even)]:mt-10 lg:[&>*:nth-child(even)]:mt-14">
          {concerns.map((concern, index) => (
            <Reveal key={concern.name} delay={index * 110}>
              <Link
                href={concern.href}
                className="group relative block transition-transform duration-500 ease-out outline-offset-[14px] focus-visible:outline-2 focus-visible:outline-[#C89B3C] [@media(hover:hover)]:hover:-translate-y-2"
              >
                {/* Gold outline frame, offset behind the photo; slides in on hover. */}
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-0 translate-x-3 translate-y-3 border border-[#C89B3C]/70 transition-transform duration-500 ease-out group-hover:translate-x-1 group-hover:translate-y-1 ${arch}`}
                />

                <div
                  className={`relative aspect-[4/5] overflow-hidden bg-[#e9e2d3] shadow-[0_18px_40px_-22px_rgba(90,60,10,0.55)] transition-shadow duration-500 group-hover:shadow-[0_34px_64px_-24px_rgba(200,155,60,0.75)] ${arch}`}
                >
                  <Image
                    src={concern.image}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 22vw, 46vw"
                    className="object-cover transition-transform duration-[1300ms] ease-out group-hover:scale-[1.08]"
                  />

                  {/* Bottom gradient so the text stays readable on any photo. */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 via-40% to-transparent transition-opacity duration-500 group-hover:from-black/90" />

                  {/* Light sweeping across the photo on hover. */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-[1000ms] ease-out group-hover:translate-x-[330%]"
                  />

                  <div className="absolute inset-x-0 bottom-0 px-4 pt-4 pb-9 text-center text-white transition-transform duration-500 ease-out group-hover:-translate-y-1.5 lg:px-5">
                    <h3 className="font-serif text-[21px] leading-tight [text-shadow:0_1px_10px_rgba(0,0,0,0.45)] lg:text-[26px]">
                      {concern.name}
                    </h3>
                    <p className="mt-1.5 font-sans text-[12px] leading-snug text-white/95 [text-shadow:0_1px_8px_rgba(0,0,0,0.5)] lg:text-[14px]">
                      {concern.description}
                    </p>
                    <span
                      aria-hidden="true"
                      className="mx-auto mt-3 block h-px w-8 bg-[#f0d28a] transition-all duration-500 group-hover:w-16"
                    />
                  </div>
                </div>

                {/* Round arrow straddling the bottom edge; pops in on hover/focus. */}
                <span
                  aria-hidden="true"
                  // Touch screens have no hover, so the arrow is simply always shown there.
                  className="absolute bottom-0 left-1/2 grid h-11 w-11 -translate-x-1/2 translate-y-1/2 scale-0 place-items-center rounded-full bg-white text-[#C89B3C] shadow-[0_10px_24px_-8px_rgba(0,0,0,0.45)] transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-100 group-focus-visible:scale-100 [@media(hover:none)]:scale-100"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5 fill-none stroke-current transition-transform duration-500 group-hover:translate-x-0.5"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
