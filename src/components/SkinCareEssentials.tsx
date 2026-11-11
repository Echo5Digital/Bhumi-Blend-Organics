import Image from "next/image";
import Link from "next/link";
import { skinCareEssentials, type Product } from "@/data/products";
import { Reveal } from "@/components/Reveal";
import { WishlistButton } from "@/components/WishlistButton";

const rupees = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
});

// One botanical sprig, drawn as fine gold line-art. Reused (rotated) in the
// corners as a nod to the leaf illustrations on the live site.
function Sprig({ className }: { className: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 200 420"
      className={`pointer-events-none absolute ${className}`}
      fill="none"
      stroke="#C89B3C"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M100 420C88 320 112 210 100 24" />
      {[0, 1, 2, 3, 4].map((i) => {
        const y = 360 - i * 66;
        const s = 1 - i * 0.12;
        return (
          <g key={i}>
            <path
              d={`M${100 - 2} ${y}C${100 - 52 * s} ${y - 8 * s} ${100 - 74 * s} ${y - 44 * s} ${100 - 72 * s} ${y - 74 * s}C${100 - 30 * s} ${y - 62 * s} ${100 - 6 * s} ${y - 32 * s} ${100 - 2} ${y}Z`}
            />
            <path
              d={`M${100 + 2} ${y - 30}C${100 + 52 * s} ${y - 38 * s} ${100 + 74 * s} ${y - 74 * s} ${100 + 72 * s} ${y - 104 * s}C${100 + 30 * s} ${y - 92 * s} ${100 + 6 * s} ${y - 62 * s} ${100 + 2} ${y - 30}Z`}
            />
          </g>
        );
      })}
      <path d="M100 24C92 14 90 6 96 0C106 6 108 14 100 24Z" />
    </svg>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span
      role="img"
      aria-label={`Rated ${rating} out of 5`}
      className="mt-1.5 flex gap-0.5"
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          aria-hidden="true"
          viewBox="0 0 24 24"
          className={`h-3.5 w-3.5 ${n <= rating ? "fill-[#C89B3C]" : "fill-[#e6dcc5]"}`}
        >
          <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8L12 2.5z" />
        </svg>
      ))}
    </span>
  );
}

function EssentialCard({ product, index }: { product: Product; index: number }) {
  const { slug, name, image, hoverImage, price, regularPrice, rating } = product;
  const href = `/product/${slug}`;
  const onOffer = regularPrice !== undefined && regularPrice > price;
  const percentOff = onOffer ? Math.round((1 - price / regularPrice) * 100) : 0;

  return (
    // Double gold frame: the card ring plus a finer line inset in the padding.
    <article className="group relative flex h-full flex-col rounded-[6px] bg-white p-3 shadow-[0_26px_50px_-32px_rgba(120,85,20,0.55)] ring-1 ring-[#C89B3C]/30 transition-[transform,box-shadow] duration-500 ease-out before:pointer-events-none before:absolute before:inset-[5px] before:rounded-[3px] before:border before:border-[#C89B3C]/25 before:transition-colors before:duration-500 focus-within:ring-[#C89B3C] sm:p-3.5 [@media(hover:hover)]:hover:-translate-y-1.5 [@media(hover:hover)]:hover:shadow-[0_40px_70px_-30px_rgba(200,155,60,0.65)] [@media(hover:hover)]:hover:ring-[#C89B3C]/80 [@media(hover:hover)]:hover:before:border-[#C89B3C]/60">
      {/* Photo. On hover (or keyboard focus) the lifestyle photo wipes up over
          the product shot like a curtain. Touch screens keep the product shot. */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-[3px] bg-[#fbf6e9]">
        <Link href={href} tabIndex={-1} aria-hidden="true" className="absolute inset-0 block">
          <Image
            src={image}
            alt={name}
            fill
            sizes="(min-width: 1024px) 340px, 50vw"
            className="object-cover transition-transform duration-[1100ms] ease-out [@media(hover:hover)]:group-hover:scale-[1.04]"
          />
          <Image
            src={hoverImage}
            alt=""
            fill
            sizes="(min-width: 1024px) 340px, 50vw"
            className="object-cover [clip-path:inset(100%_0_0_0)] transition-[clip-path] duration-[800ms] ease-[cubic-bezier(0.65,0,0.25,1)] group-focus-within:[clip-path:inset(0_0_0_0)] [@media(hover:hover)]:group-hover:[clip-path:inset(0_0_0_0)]"
          />
        </Link>

        {/* Discount ribbon — a flat gold tab with an angled end. */}
        {onOffer && (
          <span className="pointer-events-none absolute top-3 left-0 z-10 bg-gradient-to-r from-[#c8921f] to-[#9a6a17] py-1.5 pr-5 pl-2.5 font-sans text-[10.5px] font-bold tracking-[0.16em] text-white uppercase shadow-[0_6px_14px_-6px_rgba(90,60,10,0.6)] [clip-path:polygon(0_0,100%_0,calc(100%-9px)_50%,100%_100%,0_100%)] sm:pr-6 sm:pl-3 sm:text-[11px]">
            {/* Shorter on phones so it never runs into the heart button. */}
            <span className="sm:hidden">−{percentOff}%</span>
            <span className="hidden sm:inline">Save {percentOff}%</span>
          </span>
        )}

        <WishlistButton productName={name} />
      </div>

      <div className="flex flex-1 flex-col px-1.5 pt-4 pb-1.5 sm:px-2">
        {/* Index number with a hairline that turns gold on hover. */}
        <div aria-hidden="true" className="flex items-center gap-3">
          <span className="font-sans text-[11px] font-semibold tracking-[0.3em] text-[#C89B3C]">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="h-px flex-1 bg-[#C89B3C]/25 transition-colors duration-500 group-hover:bg-[#C89B3C]/80" />
        </div>

        <div className="mt-3 flex flex-1 flex-col">
          <h3 className="font-serif text-[16px] leading-snug text-[#222] sm:text-[18px] lg:text-[21px]">
            <Link
              href={href}
              className="outline-none after:absolute after:inset-0 after:content-[''] focus-visible:underline focus-visible:decoration-[#C89B3C] focus-visible:underline-offset-4"
            >
              {name}
            </Link>
          </h3>
          {rating !== undefined && <Stars rating={rating} />}

          {/* Price on the left, cart button on the right; pinned to the bottom
              so prices line up across a row even when names wrap. */}
          <div className="mt-auto flex items-end justify-between gap-2 pt-2.5">
            <p className="flex min-w-0 flex-wrap items-baseline gap-x-2.5 font-sans text-[14px] sm:text-[15px]">
              {onOffer ? (
                <>
                  <del className="text-[#9b9b9b]">
                    <span className="sr-only">Original price was </span>
                    {rupees.format(regularPrice)}
                  </del>
                  <ins className="font-semibold text-brand-gold-dark no-underline">
                    <span className="sr-only">Current price is </span>
                    {rupees.format(price)}
                  </ins>
                </>
              ) : (
                <span className="font-semibold text-brand-gold-dark">
                  {rupees.format(price)}
                </span>
              )}
            </p>

            {/* Sits above the stretched card link so it stays clickable. */}
            <button
              type="button"
              aria-label={`Add ${name} to cart`}
              className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#C89B3C]/70 text-brand-gold-dark transition-[background-color,color,transform] duration-300 hover:bg-brand-gold hover:text-white active:scale-95 sm:h-11 sm:w-11"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-[22px] w-[22px] fill-none stroke-current"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {/* Shopping cart (same glyph as the header's cart). The old
                    shopping-bag shape read as a bin at this size. */}
                <path d="M3 4h2.2l2.1 10.2a1.5 1.5 0 0 0 1.5 1.2h8.1a1.5 1.5 0 0 0 1.5-1.1L20 8H6.2" />
                <circle cx="9.5" cy="19.5" r="1.3" />
                <circle cx="17" cy="19.5" r="1.3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export function SkinCareEssentials() {
  return (
    <section
      id="skin-care-essentials"
      className="relative isolate overflow-hidden bg-white"
    >
      {/* White at both edges (it follows and precedes white-ending sections),
          warming to champagne in the middle, plus soft gold glows. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,#ffffff_0%,#fcf6e6_24%,#f9efd6_72%,#ffffff_100%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_55%_30%_at_50%_14%,rgba(200,155,60,0.18),transparent),radial-gradient(ellipse_40%_30%_at_0%_100%,rgba(200,155,60,0.16),transparent),radial-gradient(ellipse_40%_30%_at_100%_70%,rgba(200,155,60,0.12),transparent)]"
      />
      <Sprig className="-bottom-10 -left-12 h-[420px] w-[200px] -rotate-[14deg] opacity-[0.3] md:-left-4 md:h-[520px] md:w-[248px]" />
      <Sprig className="top-12 -right-12 h-[420px] w-[200px] rotate-[166deg] opacity-[0.3] md:-right-4 md:h-[520px] md:w-[248px]" />

      <div className="relative mx-auto max-w-[1160px] px-5 pt-20 pb-24 sm:px-6 md:pt-28 md:pb-32">
        <Reveal>
          <div className="text-center">
            <p className="mb-3 font-sans text-[12px] font-semibold tracking-[3px] text-[#C89B3C] uppercase">
              Radiant Skin
            </p>
            <h2 className="font-serif text-[34px] leading-[1.15] font-medium text-[#222] sm:text-[46px]">
              Skin Care{" "}
              <span className="bg-gradient-to-r from-[#b8791f] via-[#e0b552] to-[#b8791f] bg-clip-text text-transparent">
                Essentials
              </span>
            </h2>
            <div aria-hidden="true" className="mt-5 flex items-center justify-center gap-3">
              <span className="h-px w-14 bg-gradient-to-r from-transparent to-[#C89B3C]" />
              <span className="h-2 w-2 rotate-45 bg-[#C89B3C]" />
              <span className="h-px w-14 bg-gradient-to-l from-transparent to-[#C89B3C]" />
            </div>
            <p className="mx-auto mt-6 max-w-[620px] font-sans text-[15px] text-balance leading-7 text-[#5f5e5e] sm:text-[16px] sm:leading-8">
              Discover gentle, effective formulations designed to nourish, brighten, and
              restore your natural glow.
            </p>
          </div>
        </Reveal>

        {/* 2 columns on phones/tablets, 3 on desktop — all six on show, no scrolling. */}
        <ul className="mt-14 grid grid-cols-2 gap-x-3.5 gap-y-8 sm:gap-x-6 md:mt-16 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-12">
          {skinCareEssentials.map((product, index) => (
            <li key={product.slug}>
              <Reveal delay={(index % 3) * 120} className="h-full">
                <EssentialCard product={product} index={index} />
              </Reveal>
            </li>
          ))}
        </ul>

        <Reveal>
          <div className="mt-14 text-center md:mt-16">
            <Link
              href="/product-category/face"
              className="group inline-flex items-center gap-3 rounded-full border border-[#C89B3C] bg-white/70 px-8 py-3.5 font-sans text-[12px] font-semibold tracking-[0.2em] text-[#7a5212] uppercase transition-colors duration-300 hover:bg-brand-gold-dark hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C89B3C]"
            >
              Explore All Skin Care
              <span
                aria-hidden="true"
                className="inline-block transition-transform duration-500 ease-out group-hover:translate-x-1.5"
              >
                →
              </span>
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
