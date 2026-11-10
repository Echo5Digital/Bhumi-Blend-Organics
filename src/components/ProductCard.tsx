import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/data/products";
import { WishlistButton } from "@/components/WishlistButton";

const rupees = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
});

export function ProductCard({ product }: { product: Product }) {
  const { slug, name, image, hoverImage, price, regularPrice } = product;
  const href = `/product/${slug}`;
  const onOffer = regularPrice !== undefined && regularPrice > price;

  return (
    <article className="group flex h-full flex-col">
      {/* Picture panel: hover swaps to the second photo and slides "Add to Cart" up. */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-[20px] bg-white shadow-[0_14px_34px_-20px_rgba(120,85,20,0.45)] ring-1 ring-[#e9e1cf] transition-shadow duration-500 group-hover:shadow-[0_26px_46px_-22px_rgba(120,85,20,0.55)]">
        <Link
          href={href}
          tabIndex={-1}
          aria-hidden="true"
          className="absolute inset-0 block"
        >
          <div className="relative h-full w-full scale-100 transition-transform duration-[900ms] ease-out [@media(hover:hover)]:group-hover:scale-[1.05]">
            <Image
              src={image}
              alt={name}
              fill
              sizes="(min-width: 1024px) 22vw, 50vw"
              className="object-cover"
            />
            <Image
              src={hoverImage}
              alt=""
              fill
              sizes="(min-width: 1024px) 22vw, 50vw"
              className="object-cover opacity-0 transition-opacity duration-700 ease-out [@media(hover:hover)]:group-hover:opacity-100"
            />
          </div>
        </Link>

        {onOffer && (
          <span className="absolute top-3 left-3 z-10 rounded-full bg-brand-gold px-3 py-1 text-[11px] font-semibold tracking-[0.14em] text-white uppercase shadow-sm">
            Offer
          </span>
        )}

        <WishlistButton productName={name} />

        {/* Mouse users: slides up over the photo on hover / keyboard focus. */}
        <button
          type="button"
          aria-label={`Add ${name} to cart`}
          className="absolute inset-x-3 bottom-3 z-10 translate-y-[170%] rounded-full bg-[#222] px-4 py-3 text-[12px] font-semibold tracking-[0.14em] text-white uppercase transition-[transform,background-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-focus-within:translate-y-0 hover:bg-brand-gold-dark group-hover:translate-y-0 [@media(hover:none)]:hidden"
        >
          Add to Cart
        </button>
      </div>

      <div className="flex flex-1 flex-col px-1 pt-5 text-center">
        <h3 className="font-serif text-[16px] leading-snug text-[#222] sm:text-[18px] lg:text-[20px]">
          <Link
            href={href}
            className="relative inline-block pb-2 after:absolute after:bottom-0 after:left-1/2 after:h-px after:w-0 after:-translate-x-1/2 after:bg-brand-gold after:transition-all after:duration-500 group-hover:after:w-12"
          >
            {name}
          </Link>
        </h3>
        <p className="mt-1 flex flex-wrap items-baseline justify-center gap-x-2.5 text-[15px]">
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
            <span className="font-semibold text-[#222]">
              {rupees.format(price)}
            </span>
          )}
        </p>

        {/* Touch screens have no hover, and an overlay would hide the product,
            so the button sits under the price instead. */}
        <div className="mt-auto hidden pt-4 [@media(hover:none)]:block">
          <button
            type="button"
            aria-label={`Add ${name} to cart`}
            className="w-full rounded-full border border-[#222] px-4 py-2.5 text-[12px] font-semibold tracking-[0.14em] text-[#222] uppercase transition-colors duration-300 active:bg-[#222] active:text-white"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </article>
  );
}
