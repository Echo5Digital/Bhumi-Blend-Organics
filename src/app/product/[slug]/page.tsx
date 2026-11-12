import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
import { ProductGallery } from "@/components/product/ProductGallery";
import { CheckIcon, StarIcon } from "@/components/product/ProductIcons";
import { PurchasePanel } from "@/components/product/PurchasePanel";
import {
  getCatalogueProduct,
  getProductDetail,
  getRelatedProducts,
  productDetails,
} from "@/data/productDetails";

const rupees = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
});

export function generateStaticParams() {
  return productDetails.map((detail) => ({ slug: detail.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const detail = getProductDetail(slug);
  const product = getCatalogueProduct(slug);
  if (!detail || !product) return {};

  return {
    title: `Buy ${product.name} | Bhumi Blend Organics`,
    description: detail.description[0],
  };
}

// Section title with a short gold rule under it.
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-serif text-[28px] leading-tight font-medium text-[#222] sm:text-[36px]">
        {children}
      </h2>
      <span aria-hidden="true" className="mt-3 block h-[3px] w-14 rounded-full bg-brand-gold" />
    </div>
  );
}

// Shown only while the product streams in (for example a slug that wasn't
// prerendered); same footprint as the real hero so nothing jumps.
function ProductSkeleton() {
  const block = "rounded-xl bg-[#f7efd9] motion-safe:animate-pulse";
  return (
    <div
      aria-hidden="true"
      className="mx-auto grid max-w-[1290px] gap-10 px-5 py-8 sm:px-6 md:py-12 lg:grid-cols-2 lg:gap-16 lg:py-16"
    >
      <div className={`mx-auto aspect-[3/4] w-full max-w-[520px] lg:mx-0 ${block}`} />
      <div className="space-y-5">
        <div className={`h-12 w-3/4 ${block}`} />
        <div className={`h-5 w-1/3 ${block}`} />
        <div className={`h-10 w-1/4 ${block}`} />
        <div className={`h-40 ${block}`} />
      </div>
    </div>
  );
}

// `params` is URL data, so it is only read inside this component, behind the
// <Suspense> boundary in the page below — that keeps the route's shared shell
// independent of any one URL (see "Move URL data behind Suspense" in the docs).
async function ProductContent({
  params,
}: Pick<PageProps<"/product/[slug]">, "params">) {
  const { slug } = await params;
  const detail = getProductDetail(slug);
  const product = getCatalogueProduct(slug);
  if (!detail || !product) notFound();

  const { name, price, regularPrice } = product;
  const onOffer = regularPrice !== undefined && regularPrice > price;
  const related = getRelatedProducts(detail);
  const { rating } = detail;
  const reviewLabel = `${rating.count} customer ${rating.count === 1 ? "review" : "reviews"}`;

  return (
    <>
      {/* ───────── Gallery + product summary ───────── */}
      <section>
        <div className="mx-auto grid max-w-[1290px] gap-10 px-5 py-8 sm:px-6 md:py-12 lg:grid-cols-2 lg:gap-16 lg:py-16">
          <div className="mx-auto w-full max-w-[520px] lg:mx-0">
            <ProductGallery images={detail.gallery} productName={name} />
          </div>

          <div className="flex min-w-0 flex-col">
            <h1 className="font-serif text-[32px] leading-[1.1] font-medium text-[#222] sm:text-[44px]">
              {name}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span
                role="img"
                aria-label={`Rated ${rating.value} out of 5`}
                className="flex gap-0.5 text-[#C89B3C]"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <span key={n} className={n <= rating.value ? "" : "text-[#e6dcc5]"}>
                    <StarIcon />
                  </span>
                ))}
              </span>
              <span className="font-system text-[14px] text-[#666]">({reviewLabel})</span>
            </div>

            <p className="mt-6 flex flex-wrap items-baseline gap-x-3 font-system">
              {onOffer ? (
                <>
                  <del className="text-[18px] text-[#9b9b9b]">
                    <span className="sr-only">Original price was </span>
                    {rupees.format(regularPrice)}
                  </del>
                  <ins className="text-[34px] font-semibold text-brand-gold-dark no-underline">
                    <span className="sr-only">Current price is </span>
                    {rupees.format(price)}
                  </ins>
                </>
              ) : (
                <span className="text-[34px] font-semibold text-[#222]">
                  {rupees.format(price)}
                </span>
              )}
            </p>

            <span
              aria-hidden="true"
              className="mt-6 block h-px w-full bg-gradient-to-r from-[#d9bd7a] via-[#eadcb6] to-transparent"
            />

            <p className="mt-6 w-fit rounded-full border border-[#e2d5b6] px-4 py-1 font-system text-[14px] font-bold text-[#222]">
              {detail.weight}
            </p>
            <p className="mt-4 font-serif text-[21px] text-brand-gold-dark italic sm:text-[23px]">
              {detail.tagline}
            </p>

            {/* One line with "|" dividers wherever it fits (tablet, wide desktop);
                a tidy 2×2 grid on phones and in the narrow column at ~1024px. */}
            <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 font-system text-[15px] font-bold text-[#222] sm:flex sm:flex-wrap sm:gap-x-3 sm:gap-y-1 lg:grid lg:gap-x-4 lg:gap-y-2 xl:flex xl:gap-x-3 xl:gap-y-1">
              {detail.highlights.map((item) => (
                <li
                  key={item}
                  className="sm:not-last:after:ml-3 sm:not-last:after:font-normal sm:not-last:after:text-brand-gold sm:not-last:after:content-['|'] lg:not-last:after:content-none xl:not-last:after:content-['|']"
                >
                  {item}
                </li>
              ))}
            </ul>

            <p className="mt-4 font-system text-[16px] leading-[1.7] text-[#555]">
              {detail.summary}
            </p>

            <div className="mt-7">
              <PurchasePanel productName={name} />
            </div>

            <div className="relative mt-8 overflow-hidden rounded-2xl border border-[#eadcb6] bg-white p-6 pl-7 shadow-[0_18px_36px_-28px_rgba(120,85,20,0.5)]">
              <span
                aria-hidden="true"
                className="absolute inset-y-5 left-0 w-[3px] rounded-full bg-brand-gold"
              />
              <h2 className="font-serif text-[22px] text-[#222]">Why Choose Bhumi Blend</h2>
              <ul className="mt-4 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
                {detail.whyChoose.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 font-system text-[14.5px] leading-snug text-[#444]"
                  >
                    <span className="mt-0.5 shrink-0 text-brand-gold-dark">
                      <CheckIcon className="h-4 w-4" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-6 font-system text-[12px] leading-relaxed text-[#8a8a8a]">
              <span className="font-semibold text-[#6d6c6c]">SKU:</span> {detail.sku}
              <span aria-hidden="true" className="mx-2.5">
                |
              </span>
              <span className="font-semibold text-[#6d6c6c]">Categories:</span>{" "}
              {detail.categories.join(", ")}
            </p>
          </div>
        </div>
      </section>

      {/* ───────── Description ───────── */}
      <section id="description" className="border-t border-[#efe5c9]">
        <div className="mx-auto max-w-[1290px] px-5 py-14 sm:px-6 md:py-20">
          <Reveal>
            <SectionTitle>Description</SectionTitle>
            <div className="mt-7 max-w-[980px] space-y-5 font-system text-[16px] leading-[1.85] text-[#555]">
              {detail.description.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </Reveal>

          <div className="mt-12 space-y-5 sm:space-y-6">
            {detail.ingredients.map((ingredient, index) => (
              <Reveal key={ingredient.name} delay={index * 120}>
                <article className="flex flex-col gap-5 rounded-[22px] bg-white p-4 shadow-[0_22px_44px_-30px_rgba(120,85,20,0.55)] ring-1 ring-[#eadcb6] sm:flex-row sm:items-center sm:gap-8 sm:p-6">
                  {/* Source photo is 228×152: full width on phones, native size from sm up. */}
                  <div className="relative aspect-[3/2] w-full shrink-0 overflow-hidden rounded-2xl sm:h-[152px] sm:w-[228px]">
                    <Image
                      src={ingredient.image}
                      alt={ingredient.name}
                      fill
                      sizes="(min-width: 640px) 228px, 100vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-serif text-[21px] leading-snug text-[#222] sm:text-[24px]">
                      {ingredient.name}{" "}
                      <span className="text-brand-gold-dark">({ingredient.origin})</span>
                    </h3>
                    <p className="mt-2.5 font-system text-[15px] leading-[1.75] text-[#555] sm:text-[16px]">
                      {ingredient.text}
                    </p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>

          {/* Organic badge sits directly above this line. */}
          <Reveal className="mt-16 flex flex-col items-center text-center md:mt-20">
            <Image
              src="/orgnc_icon.png"
              alt="100% Organic"
              width={250}
              height={212}
              className="h-auto w-[104px] drop-shadow-[0_8px_12px_rgba(90,60,10,0.25)] sm:w-[124px]"
            />
            <p className="mt-5 max-w-[640px] font-serif text-[22px] leading-snug text-[#222] sm:text-[30px]">
              {detail.calmingLine}
            </p>
          </Reveal>

          {/* The five badges are 100×100 PNGs, so they're capped near that size to stay sharp. */}
          <ul className="mt-12 flex flex-wrap justify-center gap-y-9 md:mt-16">
            {detail.trust.map((item, index) => (
              <li key={item.label} className="basis-1/2 px-2 sm:basis-1/3 lg:basis-1/5">
                <Reveal
                  delay={index * 90}
                  className="flex flex-col items-center gap-3 text-center"
                >
                  <Image
                    src={item.image}
                    alt=""
                    width={100}
                    height={100}
                    className="h-[80px] w-[80px] sm:h-[92px] sm:w-[92px]"
                  />
                  <span className="max-w-[150px] font-system text-[14px] leading-snug font-semibold text-[#3b3226] sm:text-[15px]">
                    {item.label}
                  </span>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ───────── Related products ───────── */}
      {related.length > 0 && (
        <section id="related" className="border-t border-[#efe5c9]">
          <div className="mx-auto max-w-[1290px] px-5 py-14 sm:px-6 md:py-20">
            <SectionTitle>Related products</SectionTitle>

            {/* Phones/tablets: swipe sideways. Desktop: all five in one row. */}
            <ul className="-mx-5 mt-10 flex snap-x snap-mandatory scroll-pl-5 gap-4 overflow-x-auto px-5 pb-4 [scrollbar-width:none] sm:-mx-6 sm:scroll-pl-6 sm:gap-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0 lg:pb-0">
              {related.map((item) => (
                <li
                  key={item.slug}
                  className="w-[64%] shrink-0 snap-start sm:w-[36%] md:w-[28%] lg:w-auto"
                >
                  <ProductCard product={item} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}

export default function ProductPage({ params }: PageProps<"/product/[slug]">) {
  return (
    <>
      <main className="overflow-x-clip bg-white">
        <Suspense fallback={<ProductSkeleton />}>
          <ProductContent params={params} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
