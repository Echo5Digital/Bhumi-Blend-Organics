"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import type { Product } from "@/data/products";
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

function ProductTile({ product, view }: { product: Product; view: View }) {
  const { slug, name, image, hoverImage, price, regularPrice } = product;
  const href = `/product/${slug}`;
  const onOffer = regularPrice !== undefined && regularPrice > price;
  const isList = view === "list";

  return (
    <article
      className={`group relative bg-white ring-1 ring-[#efe8d6] shadow-[0_2px_14px_rgba(120,85,20,0.07)] transition-shadow duration-500 hover:shadow-[0_18px_34px_-18px_rgba(120,85,20,0.45)] ${
        isList ? "flex flex-row" : "flex h-full flex-col"
      }`}
    >
      {/* Photo: hover (mouse only) crossfades to the second picture. */}
      <div
        className={`relative aspect-[3/4] shrink-0 overflow-hidden ${
          isList ? "w-[38%] max-w-[240px]" : "w-full border-b border-[#eee]"
        }`}
      >
        <Link href={href} tabIndex={-1} aria-hidden="true" className="absolute inset-0 block">
          <Image
            src={image}
            alt={name}
            fill
            sizes={isList ? "240px" : "(min-width: 1024px) 430px, 50vw"}
            className="object-cover"
          />
          {hoverImage !== image && (
            <Image
              src={hoverImage}
              alt=""
              fill
              sizes={isList ? "240px" : "(min-width: 1024px) 430px, 50vw"}
              className="object-cover opacity-0 transition-opacity duration-700 ease-out [@media(hover:hover)]:group-hover:opacity-100"
            />
          )}
        </Link>

        <WishlistButton productName={name} className="top-2.5 left-2.5 sm:top-3 sm:left-3" />

        {onOffer && (
          <span className="absolute top-3 right-0 z-10 bg-brand-gold px-2.5 py-0.5 font-system text-[12px] font-bold text-white sm:text-[13px]">
            Offer
          </span>
        )}
      </div>

      <div
        className={`flex flex-1 flex-col ${
          isList ? "justify-center gap-1 p-4 sm:gap-2 sm:p-8" : "px-3.5 pt-4 pb-5 sm:px-6 sm:pt-5 sm:pb-6"
        }`}
      >
        <h3 className="font-system text-[15px] leading-snug font-medium text-[#222] sm:text-[18px]">
          <Link
            href={href}
            className="transition-colors duration-300 group-hover:text-brand-gold-dark"
          >
            {name}
          </Link>
        </h3>
        <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2.5 font-system text-[14px] sm:text-[15px]">
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
            <span className="font-semibold text-[#222]">{rupees.format(price)}</span>
          )}
        </p>

        {/* Grid: space is always reserved, so the card never changes height;
            the button fades in on hover / keyboard focus. Touch screens have no
            hover and list view has room, so there it is always visible. */}
        <div className="mt-3.5">
          <button
            type="button"
            aria-label={`Add ${name} to cart`}
            className={`max-sm:w-full rounded-sm bg-brand-gold px-4 py-2.5 font-system text-[12px] font-bold tracking-[0.1em] text-white uppercase transition-[opacity,transform,background-color] duration-300 hover:bg-brand-gold-dark ${
              isList
                ? ""
                : "[@media(hover:hover)]:translate-y-1 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within:translate-y-0 [@media(hover:hover)]:group-focus-within:opacity-100 [@media(hover:hover)]:group-hover:translate-y-0 [@media(hover:hover)]:group-hover:opacity-100"
            }`}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </article>
  );
}

export function ShopProducts({ products }: { products: Product[] }) {
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
        <div
          ref={topRef}
          className="flex scroll-mt-32 flex-wrap items-center justify-between gap-x-4 gap-y-3 py-6 md:py-8"
        >
          <p className="font-system text-[15px] text-[#444] sm:text-[16px]" aria-live="polite">
            {total === 0
              ? "No products found"
              : `Showing ${first + 1}–${first + visible.length} of ${total} ${total === 1 ? "result" : "results"}`}
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
