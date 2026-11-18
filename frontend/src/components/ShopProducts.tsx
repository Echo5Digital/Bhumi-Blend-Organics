"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import type { Product } from "@/data/products";
import { AddToCartButton } from "@/components/AddToCartButton";
import { Stars } from "@/components/Stars";
import { WishlistButton } from "@/components/WishlistButton";

const PER_PAGE = 9;

const rupees = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
});

type Sort = "default" | "price-asc" | "price-desc";
type View = "grid" | "list";

const sortOptions: { value: Sort; label: string }[] = [
  { value: "default", label: "Default sorting" },
  { value: "price-asc", label: "Sort by price: low to high" },
  { value: "price-desc", label: "Sort by price: high to low" },
];

function GridIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current">
      <path d="M3 3h5v5H3V3Zm6.5 0h5v5h-5V3ZM16 3h5v5h-5V3ZM3 9.5h5v5H3v-5Zm6.5 0h5v5h-5v-5Zm6.5 0h5v5h-5v-5ZM3 16h5v5H3v-5Zm6.5 0h5v5h-5v-5Zm6.5 0h5v5h-5v-5Z" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current">
      <path d="M3 4.5h18v3H3v-3Zm0 6h18v3H3v-3Zm0 6h18v3H3v-3Z" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px] shrink-0 fill-none stroke-current"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 7h12l-1 13H7L6 7Z" />
      <path d="M9 10V6.5a3 3 0 0 1 6 0V10" />
    </svg>
  );
}

// A framed card: the photo sits inside a soft rounded border, with the name,
// price and an "Add to Cart" pill centred underneath (left-aligned in list view).
// On a mouse the card lifts, its border turns gold, the photo crossfades to the
// second picture and the button fills in. Touch screens have no hover, so the
// button is already filled there.
function ProductTile({ product, view }: { product: Product; view: View }) {
  const { slug, name, image, hoverImage, price, regularPrice, rating } = product;
  const href = `/product/${slug}`;
  const onOffer = regularPrice !== undefined && regularPrice > price;
  const percentOff = onOffer ? Math.round((1 - price / regularPrice) * 100) : 0;
  const isList = view === "list";
  const imageSizes = isList ? "240px" : "(min-width: 1024px) 430px, 50vw";

  return (
    <article
      className={`group relative rounded-[22px] bg-gradient-to-b from-[#fdf8ea] to-[#f8eed6] p-2 shadow-[0_10px_30px_-18px_rgba(120,85,20,0.38)] ring-1 ring-[#ecdcb4] transition-[transform,box-shadow] duration-500 ease-out sm:rounded-[26px] sm:p-2.5 [@media(hover:hover)]:hover:-translate-y-1.5 [@media(hover:hover)]:hover:shadow-[0_28px_44px_-22px_rgba(184,121,31,0.55)] [@media(hover:hover)]:hover:ring-brand-gold/60 ${
        isList ? "flex flex-row" : "flex h-full flex-col"
      }`}
    >
      {/* Photo: hover (mouse only) crossfades to the second picture. */}
      <div
        className={`relative aspect-[3/4] shrink-0 overflow-hidden rounded-[14px] bg-white shadow-[0_1px_0_rgba(255,255,255,0.9),0_0_0_1px_rgba(200,155,60,0.18)] sm:rounded-[16px] ${
          isList ? "w-[38%] max-w-[240px]" : "w-full"
        }`}
      >
        <Link href={href} tabIndex={-1} aria-hidden="true" className="absolute inset-0 block">
          <div className="relative h-full w-full transition-transform duration-[900ms] ease-out [@media(hover:hover)]:group-hover:scale-[1.05]">
            <Image src={image} alt={name} fill sizes={imageSizes} className="object-cover" />
            {hoverImage !== image && (
              <Image
                src={hoverImage}
                alt=""
                fill
                sizes={imageSizes}
                className="object-cover opacity-0 transition-opacity duration-700 ease-out [@media(hover:hover)]:group-hover:opacity-100"
              />
            )}
          </div>
        </Link>

        {onOffer && (
          <span className="absolute top-2.5 left-2.5 z-10 rounded-full bg-gradient-to-r from-brand-gold to-brand-gold-dark px-2.5 py-1 font-system text-[10.5px] leading-none font-bold tracking-[0.08em] text-white uppercase shadow-[0_6px_12px_-6px_rgba(184,121,31,0.8)] sm:top-3 sm:left-3 sm:px-3 sm:py-1.5 sm:text-[11.5px]">
            Save {percentOff}%
          </span>
        )}

        <WishlistButton
          slug={slug}
          productName={name}
          className="top-2 right-2 sm:top-2.5 sm:right-2.5"
        />
      </div>

      <div
        className={`flex flex-1 flex-col ${
          isList
            ? "justify-center gap-1 p-4 sm:p-8"
            : "items-center px-1.5 pt-4 pb-2 text-center sm:px-3 sm:pt-5 sm:pb-3"
        }`}
      >
        <h3 className="font-serif text-[15px] leading-snug text-[#222] sm:text-[19px]">
          <Link href={href} className="transition-colors duration-300 group-hover:text-brand-gold-dark">
            {name}
          </Link>
        </h3>
        {rating !== undefined && (
          <div className={`flex ${isList ? "justify-start" : "justify-center"}`}>
            <Stars rating={rating} />
          </div>
        )}

        {/* Short gold rule that lengthens when the card is hovered. */}
        <span
          aria-hidden="true"
          className="my-2.5 block h-px w-8 bg-brand-gold transition-all duration-500 group-hover:w-14 sm:my-3 sm:w-10"
        />

        <p
          className={`flex flex-wrap items-baseline gap-x-2.5 font-system text-[14px] sm:text-[16px] ${
            isList ? "justify-start" : "justify-center"
          }`}
        >
          {onOffer ? (
            <>
              <del className="text-[13px] text-[#a3a3a3] sm:text-[14px]">
                <span className="sr-only">Original price was </span>
                {rupees.format(regularPrice)}
              </del>
              <ins className="text-[16px] font-bold text-brand-gold-dark no-underline sm:text-[18px]">
                <span className="sr-only">Current price is </span>
                {rupees.format(price)}
              </ins>
            </>
          ) : (
            <span className="text-[16px] font-bold text-[#222] sm:text-[18px]">
              {rupees.format(price)}
            </span>
          )}
        </p>

        <div className={`pt-4 sm:pt-5 ${isList ? "" : "mt-auto w-full"}`}>
          <AddToCartButton
            slug={slug}
            productName={name}
            soldOut={product.inStock === false}
            className={`inline-flex items-center justify-center gap-2 rounded-full border border-brand-gold py-2.5 font-system text-[11px] font-bold tracking-[0.1em] whitespace-nowrap text-brand-gold-dark uppercase transition-[background-color,color,box-shadow,border-color] duration-300 hover:border-brand-gold-dark hover:bg-brand-gold-dark hover:text-white focus-visible:bg-brand-gold focus-visible:text-white group-hover:bg-brand-gold group-hover:text-white group-hover:shadow-[0_10px_18px_-10px_rgba(184,121,31,0.85)] sm:text-[12px] [@media(hover:none)]:bg-brand-gold [@media(hover:none)]:text-white [@media(hover:none)]:shadow-[0_8px_14px_-8px_rgba(184,121,31,0.8)] [@media(hover:none)]:active:bg-brand-gold-dark ${
              isList ? "px-7" : "w-full px-3"
            }`}
          >
            <CartIcon />
            Add to Cart
          </AddToCartButton>
        </div>
      </div>
    </article>
  );
}

export function ShopProducts({
  products,
  heading,
}: {
  products: Product[];
  /** Optional centred section title above the toolbar (the category pages use it). */
  heading?: string;
}) {
  const [sort, setSort] = useState<Sort>("default");
  const [view, setView] = useState<View>("grid");
  const [page, setPage] = useState(1);
  const topRef = useRef<HTMLDivElement>(null);

  const sorted = useMemo(() => {
    if (sort === "default") return products;
    const direction = sort === "price-asc" ? 1 : -1;
    return [...products].sort((a, b) => (a.price - b.price) * direction);
  }, [products, sort]);

  const total = sorted.length;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const current = Math.min(page, pages);
  const first = (current - 1) * PER_PAGE;
  const visible = sorted.slice(first, first + PER_PAGE);

  const goToPage = (next: number) => {
    setPage(next);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="bg-brand-cream pb-16 md:pb-24">
      <div className="mx-auto max-w-[1330px] px-4 sm:px-6">
        {heading && (
          <div className="pt-12 text-center md:pt-16">
            <h2 className="font-serif text-[30px] leading-tight font-medium text-[#222] md:text-[40px]">
              {heading}
            </h2>
            <span
              aria-hidden="true"
              className="mx-auto mt-4 block h-[3px] w-14 rounded-full bg-brand-gold"
            />
          </div>
        )}

        <div
          ref={topRef}
          className="flex scroll-mt-32 flex-wrap items-center justify-between gap-x-4 gap-y-3 py-6 md:py-8"
        >
          <p className="font-system text-[15px] text-[#444] sm:text-[16px]" aria-live="polite">
            {total === 0
              ? "No products found"
              : pages === 1
                ? `Showing all ${total} ${total === 1 ? "result" : "results"}`
                : `Showing ${first + 1}–${first + visible.length} of ${total} results`}
          </p>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative">
              <label htmlFor="shop-sort" className="sr-only">
                Sort products
              </label>
              <select
                id="shop-sort"
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value as Sort);
                  setPage(1);
                }}
                className="cursor-pointer appearance-none border-0 border-b border-[#d9cfb8] bg-transparent py-2 pr-8 pl-1 font-system text-[15px] text-[#222] focus:border-brand-gold focus:outline-none sm:text-[16px]"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="pointer-events-none absolute top-1/2 right-1 h-4 w-4 -translate-y-1/2 fill-none stroke-[#777]"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>

            <div className="flex gap-2">
              {(
                [
                  { value: "grid", label: "Grid view", icon: <GridIcon /> },
                  { value: "list", label: "List view", icon: <ListIcon /> },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-label={option.label}
                  aria-pressed={view === option.value}
                  onClick={() => setView(option.value)}
                  className={`grid h-10 w-10 cursor-pointer place-items-center rounded-sm border transition-colors duration-300 ${
                    view === option.value
                      ? "border-brand-gold bg-white text-brand-gold-dark shadow-sm"
                      : "border-transparent text-[#777] hover:text-brand-gold-dark"
                  }`}
                >
                  {option.icon}
                </button>
              ))}
            </div>
          </div>
        </div>

        <ul
          className={
            view === "grid"
              ? "grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-3"
              : "flex flex-col gap-4 sm:gap-5"
          }
        >
          {visible.map((product) => (
            <li key={product.slug}>
              <ProductTile product={product} view={view} />
            </li>
          ))}
        </ul>

        {pages > 1 && (
          <nav aria-label="Product pages" className="mt-12 flex items-center gap-2">
            {Array.from({ length: pages }, (_, index) => index + 1).map((number) => (
              <button
                key={number}
                type="button"
                aria-label={`Page ${number}`}
                aria-current={number === current ? "page" : undefined}
                onClick={() => goToPage(number)}
                className={`grid h-10 min-w-10 cursor-pointer place-items-center rounded-sm px-3 font-system text-[16px] transition-colors duration-300 ${
                  number === current
                    ? "bg-brand-gold text-white"
                    : "text-[#444] hover:bg-white hover:text-brand-gold-dark"
                }`}
              >
                {number}
              </button>
            ))}
            {current < pages && (
              <button
                type="button"
                aria-label="Next page"
                onClick={() => goToPage(current + 1)}
                className="grid h-10 min-w-10 cursor-pointer place-items-center rounded-sm px-3 font-system text-[16px] text-[#444] transition-colors duration-300 hover:bg-white hover:text-brand-gold-dark"
              >
                →
              </button>
            )}
          </nav>
        )}
      </div>
    </section>
  );
}
