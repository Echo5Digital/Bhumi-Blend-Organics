import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type CSSProperties } from "react";
import { CategoryIngredients } from "@/components/CategoryIngredients";
import { Footer } from "@/components/Footer";
import { ShopProducts } from "@/components/ShopProducts";
import { TrustBar } from "@/components/TrustBar";
import { categories, getCategory, type Category } from "@/data/categories";

export function generateStaticParams() {
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/product-category/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) return {};

  return {
    title: category.metaTitle,
    description: category.metaDescription,
  };
}

// Photo banner. Phones and tablets: the photo on top and the text under it on
// the page's cream, the photo's bottom edge melting into it. From 1024px the
// text sits on the cream at the left and the photo fills the rest, joined to
// the cream by a fade. `bannerPhotoLeft` is 0 when the photo fills the whole
// banner (the fade covers its plain left side), or the percent where the photo
// starts when it only takes the right part and fades in at its own left edge.
function CategoryBanner({ category }: { category: Category }) {
  const photoLeft = category.bannerPhotoLeft;
  const photoRight = photoLeft > 0;

  return (
    <section className="relative isolate overflow-hidden bg-brand-cream lg:h-[clamp(440px,34vw,660px)]">
      <div
        // `lg:left-(--photo-left)` reads this variable: the photo box starts
        // there from 1024px up (0% = the whole banner).
        style={{ "--photo-left": `${photoLeft}%` } as CSSProperties}
        className="relative aspect-[4/3.3] w-full sm:aspect-[2/1] lg:absolute lg:inset-y-0 lg:right-0 lg:left-(--photo-left) lg:aspect-auto lg:w-auto"
      >
        <Image
          src={category.bannerImage}
          alt={category.bannerAlt}
          fill
          sizes={`(min-width: 1024px) ${100 - photoLeft}vw, 100vw`}
          loading="eager"
          fetchPriority="high"
          // Small JPEGs are served as-is so they aren't re-compressed; big
          // files (a PNG) go through Next's optimizer.
          unoptimized={!category.bannerOptimize}
          className="object-cover"
          style={{ objectPosition: category.bannerFocus }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-brand-cream to-transparent lg:hidden"
        />
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 hidden lg:block ${
            photoRight
              ? "bg-[linear-gradient(90deg,#fcfcf5_0%,rgba(252,252,245,0.9)_10%,rgba(252,252,245,0)_26%)]"
              : "bg-[linear-gradient(90deg,#fcfcf5_0%,rgba(252,252,245,0.94)_28%,rgba(252,252,245,0.5)_44%,rgba(252,252,245,0)_60%)]"
          }`}
        />
      </div>

      <div className="relative mx-auto -mt-2 max-w-[1290px] px-6 pb-12 sm:pb-14 lg:mt-0 lg:flex lg:h-full lg:items-center lg:pb-0">
        {/* Narrower on small desktops so the text never runs onto the photo. */}
        <div className="max-w-[540px] lg:max-w-[min(540px,42vw)]">
          <p className="mb-4 flex items-center gap-3 font-sans text-[12px] font-semibold tracking-[3px] text-brand-gold-dark uppercase sm:text-[13px] lg:mb-5">
            <span aria-hidden="true" className="h-px w-8 bg-brand-gold" />
            {category.eyebrow}
          </p>
          <h1 className="font-serif text-[34px] leading-[1.14] font-medium text-[#222] sm:text-[44px] lg:text-[clamp(40px,3.8vw,60px)]">
            {category.heading}{" "}
            <span className="bg-gradient-to-r from-[#a96a12] to-[#d9a63f] bg-clip-text text-transparent">
              {category.headingAccent}
            </span>
          </h1>
          <span aria-hidden="true" className="mt-5 block h-[3px] w-14 rounded-full bg-brand-gold" />
          <p className="mt-5 max-w-[30em] font-system text-[16px] leading-7 text-[#4a4036] lg:text-[18px] lg:leading-8">
            {category.intro}
          </p>
          <Link
            href="#products"
            className="group mt-7 inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-[#e6bd62] to-[#C89B3C] px-8 py-3.5 font-sans text-[15px] font-semibold text-[#2a1a05] shadow-[0_14px_28px_-14px_rgba(184,121,31,0.85)] transition-[filter,transform] duration-300 hover:-translate-y-0.5 hover:brightness-105 lg:mt-8"
          >
            {category.ctaLabel}
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-4 w-4 fill-none stroke-current transition-transform duration-300 group-hover:translate-y-0.5"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

// Shown only while the category streams in (for example a slug that wasn't
// prerendered); about the banner's height so nothing jumps.
function CategorySkeleton() {
  return (
    <div
      aria-hidden="true"
      className="h-[520px] bg-[#f7efd9] motion-safe:animate-pulse lg:h-[480px]"
    />
  );
}

// `params` is URL data, so it is only read inside this component, behind the
// <Suspense> boundary in the page below (same pattern as the product page).
async function CategoryContent({
  params,
}: Pick<PageProps<"/product-category/[slug]">, "params">) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  return (
    <>
      <CategoryBanner category={category} />
      <TrustBar />
      {/* The page already pads scrolling for the sticky header (globals.css). */}
      <div id="products">
        <ShopProducts products={category.products} heading={category.listHeading} />
      </div>
      {category.ingredients && <CategoryIngredients section={category.ingredients} />}
    </>
  );
}

export default function CategoryPage({ params }: PageProps<"/product-category/[slug]">) {
  return (
    <>
      <main>
        <Suspense fallback={<CategorySkeleton />}>
          <CategoryContent params={params} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
