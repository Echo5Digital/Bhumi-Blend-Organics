import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
import { ProductGallery } from "@/components/product/ProductGallery";
import { CheckIcon, StarIcon } from "@/components/product/ProductIcons";
import { ProductTabs } from "@/components/product/ProductTabs";
import { PurchasePanel } from "@/components/product/PurchasePanel";
import { getCatalogue, getProductPage } from "@/lib/catalog";

const rupees = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
});

export async function generateStaticParams() {
  const products = await getCatalogue();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = await getProductPage(slug);
  const detail = page?.detail;
  const product = page?.product;
  if (!detail || !product) return {};

  return {
    title: `Buy ${product.name} | Bhumi Blend Organics`,
    description: detail.description[0] ?? detail.summary,
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
  const page = await getProductPage(slug);
  if (!page) notFound();
  const { product, detail, related } = page;

  const { name, price, regularPrice } = product;
  const onOffer = regularPrice !== undefined && regularPrice > price;
  // The products a kit is made of, from the catalogue (price and photo stay in one place).
  const bundleItems = page.bundle.map(({ item, quantity }) => ({ item, quantity, hasPage: true }));
  const { rating } = detail;
  // A product with no description text (the live page's tab is empty) gets no Description tab.
  const hasDescription = detail.description.length > 0;
  // The highlighted offer (a coupon, or a bonus), shown above or below the pitch line.
  const offerBox = detail.offer ? (
    <div className="mt-6 rounded-2xl border border-[#e2d5b6] bg-[#fbf3de] px-5 py-4">
      <p className="font-system text-[16px] font-bold text-[#222]">{detail.offer.headline}</p>
      <p className="mt-1 font-system text-[15px] leading-snug text-[#444]">
        {detail.offer.code ? (
          <>
            {detail.offer.detail.split(detail.offer.code)[0]}
            <strong className="rounded-md bg-white px-2 py-0.5 font-bold tracking-[0.5px] text-brand-gold-dark ring-1 ring-[#C89B3C]/40">
              {detail.offer.code}
            </strong>
            {detail.offer.detail.split(detail.offer.code)[1]}
          </>
        ) : (
          detail.offer.detail
        )}
      </p>
    </div>
  ) : null;
  const reviewLabel = `${rating.count} customer ${rating.count === 1 ? "review" : "reviews"}`;

  return (
    <>
      {/* ───────── Gallery + product summary ───────── */}
      <section>
        <div className="mx-auto grid max-w-[1290px] gap-10 px-5 py-8 sm:px-6 md:py-12 lg:grid-cols-2 lg:gap-16 lg:py-16">
          {/* min-w-0: lets this grid column shrink to the screen, so a long
              scrolling thumbnail strip can't widen the whole page. */}
          <div className="mx-auto w-full max-w-[520px] min-w-0 lg:mx-0">
            <ProductGallery images={detail.gallery} productName={name} />
          </div>

          <div className="flex min-w-0 flex-col">
            <h1 className="font-serif text-[32px] leading-[1.1] font-medium text-[#222] sm:text-[44px]">
              {name}
            </h1>

            {/* Only shown once a product has reviews: no empty stars or "(0 customer reviews)". */}
            {rating.count > 0 && (
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
            )}

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

            {detail.weight && (
              <p className="mt-6 w-fit rounded-full border border-[#e2d5b6] px-4 py-1 font-system text-[14px] font-bold text-[#222]">
                {detail.weight}
              </p>
            )}
            {detail.tagline && (
              <p className="mt-4 font-serif text-[21px] text-brand-gold-dark italic sm:text-[23px]">
                {detail.tagline}
              </p>
            )}

            {/* One line with "|" dividers wherever it fits (tablet, wide desktop);
                a tidy 2×2 grid on phones and in the narrow column at ~1024px. */}
            {detail.highlights && (
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
            )}

            {detail.freebie && (
              <p className="mt-4 w-fit rounded-full bg-[#fbf3de] px-4 py-1.5 font-system text-[14px] font-bold text-brand-gold-dark ring-1 ring-[#C89B3C]/40">
                {detail.freebie}
              </p>
            )}

            {!detail.offer?.afterSummary && offerBox}

            {detail.summary && (
              <p className="mt-4 font-system text-[16px] leading-[1.7] text-[#555]">
                {detail.summary}
              </p>
            )}

            {detail.offer?.afterSummary && offerBox}

            {/* What a kit is made of: each product with its quantity and price. */}
            {bundleItems.length > 0 && (
              <ul className="mt-5 divide-y divide-[#efe5c9] rounded-2xl border border-[#eadcb6] bg-white">
                {bundleItems.map(({ item, quantity, hasPage }) => (
                  <li key={item.slug} className="flex items-center gap-4 px-4 py-3">
                    <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg ring-1 ring-[#eadcb6]">
                      <Image src={item.image} alt="" fill sizes="56px" className="object-cover" />
                    </span>
                    <span className="min-w-0 flex-1 font-system text-[15px] leading-snug text-[#222]">
                      {quantity} ×{" "}
                      {hasPage ? (
                        <Link
                          href={`/product/${item.slug}`}
                          className="font-semibold transition-colors duration-300 hover:text-brand-gold-dark"
                        >
                          {item.name}
                        </Link>
                      ) : (
                        <span className="font-semibold">{item.name}</span>
                      )}
                    </span>
                    <span className="flex shrink-0 flex-wrap items-baseline justify-end gap-x-2 font-system text-[14px]">
                      {item.regularPrice !== undefined && item.regularPrice > item.price ? (
                        <>
                          <del className="text-[#9b9b9b]">
                            <span className="sr-only">Original price was </span>
                            {rupees.format(item.regularPrice)}
                          </del>
                          <ins className="font-semibold text-brand-gold-dark no-underline">
                            <span className="sr-only">Current price is </span>
                            {rupees.format(item.price)}
                          </ins>
                        </>
                      ) : (
                        <span className="font-semibold text-[#222]">{rupees.format(item.price)}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-7">
              <PurchasePanel slug={slug} productName={name} soldOut={product.inStock === false} />
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
              {detail.sku && (
                <>
                  <span className="font-semibold text-[#6d6c6c]">SKU:</span> {detail.sku}
                  <span aria-hidden="true" className="mx-2.5">
                    |
                  </span>
                </>
              )}
              <span className="font-semibold text-[#6d6c6c]">Categories:</span>{" "}
              {detail.categories.join(", ")}
            </p>
          </div>
        </div>
      </section>

      {/* ───────── Tabs: Description · Usage Instructions · Reviews · FAQ ───────── */}
      <section id="product-details" className="border-t border-[#efe5c9]">
        <div className="mx-auto max-w-[1290px] px-5 pt-10 pb-14 sm:px-6 md:pt-14 md:pb-20">
          <ProductTabs
            tabs={[
              ...(hasDescription
                ? [
              {
                id: "description",
                label: "Description",
                content: (
                  <>
                    <Reveal>
                      <SectionTitle>Description</SectionTitle>
                      <div className="mt-7 max-w-[980px] space-y-5 font-system text-[16px] leading-[1.85] text-[#555]">
                        {detail.descriptionHeading && (
                          <p className="font-sans text-[12px] leading-snug font-semibold tracking-[3px] text-brand-gold-dark uppercase sm:text-[13px]">
                            {detail.descriptionHeading}
                          </p>
                        )}
                        {detail.description.map((paragraph) => (
                          <p key={paragraph}>{paragraph}</p>
                        ))}
                      </div>

                      {detail.descriptionImage && (
                        <div className="relative mt-10 aspect-[1536/658] max-w-[980px] overflow-hidden rounded-[18px] shadow-[0_26px_50px_-32px_rgba(120,85,20,0.55)] ring-1 ring-[#eadcb6] sm:rounded-[24px]">
                          <Image
                            src={detail.descriptionImage.src}
                            alt={detail.descriptionImage.alt}
                            fill
                            sizes="(min-width: 1024px) 980px, 100vw"
                            className="object-cover"
                          />
                        </div>
                      )}
                    </Reveal>

                    {detail.keyBenefits && (
                      <Reveal className="mt-12 md:mt-14">
                        {detail.keyBenefits.title && (
                          <h2 className="font-serif text-[24px] leading-tight font-medium text-[#222] sm:text-[30px]">
                            {detail.keyBenefits.title}
                          </h2>
                        )}
                        <ul
                          className={`grid max-w-[980px] gap-x-8 gap-y-3 sm:grid-cols-2 ${detail.keyBenefits.title ? "mt-5" : ""}`}
                        >
                          {detail.keyBenefits.points.map((point) => (
                            <li
                              key={point}
                              className="flex items-start gap-3 font-system text-[15px] leading-snug text-[#3b3226] sm:text-[16px]"
                            >
                              <span className="mt-0.5 shrink-0 text-brand-gold-dark">
                                <CheckIcon className="h-4 w-4" />
                              </span>
                              {point}
                            </li>
                          ))}
                        </ul>
                        {detail.keyBenefits.outro && (
                          <p className="mt-6 max-w-[980px] font-system text-[16px] leading-[1.85] text-[#555]">
                            {detail.keyBenefits.outro}
                          </p>
                        )}
                      </Reveal>
                    )}

                    {detail.philosophy && (
                      <Reveal className="mt-12 md:mt-14">
                        <div className="relative max-w-[980px] overflow-hidden rounded-2xl border border-[#eadcb6] bg-[#fbf8ef] py-8 pr-6 pl-8 sm:py-10 sm:pr-10 sm:pl-12">
                          <span
                            aria-hidden="true"
                            className="absolute inset-y-6 left-0 w-[3px] rounded-full bg-brand-gold"
                          />
                          <h2 className="font-serif text-[26px] leading-tight font-medium text-[#222] sm:text-[32px]">
                            {detail.philosophy.title}
                          </h2>
                          <div className="mt-5 space-y-4">
                            {detail.philosophy.paragraphs.map((paragraph, index) => (
                              <p
                                key={paragraph}
                                className={
                                  index === 0
                                    ? "font-serif text-[20px] leading-[1.55] text-[#2f2619] sm:text-[24px]"
                                    : "font-system text-[16px] leading-[1.8] text-[#555] sm:text-[17px]"
                                }
                              >
                                {paragraph}
                              </p>
                            ))}
                          </div>
                        </div>
                      </Reveal>
                    )}

                    {detail.ingredientsHeading && (
                      <div className="mt-14 md:mt-16">
                        <p className="font-sans text-[12px] font-semibold tracking-[3px] text-brand-gold-dark uppercase sm:text-[13px]">
                          {detail.ingredientsHeading.eyebrow}
                        </p>
                        <h2 className="mt-3 font-serif text-[28px] leading-tight font-medium text-[#222] sm:text-[36px]">
                          {detail.ingredientsHeading.title}
                        </h2>
                        <span aria-hidden="true" className="mt-3 block h-[3px] w-14 rounded-full bg-brand-gold" />
                      </div>
                    )}

                    {detail.ingredients.length > 0 && (
                    <div
                      className={`space-y-5 sm:space-y-6 ${detail.ingredientsHeading ? "mt-8" : "mt-12"}`}
                    >
                      {detail.ingredients.map((ingredient, index) => (
                        <Reveal key={ingredient.name} delay={(index % 3) * 120}>
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
                              {ingredient.tag && (
                                <p className="mb-1.5 flex items-center gap-3 font-sans text-[12px] font-semibold tracking-[2.5px] text-brand-gold-dark uppercase">
                                  <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                                  <span aria-hidden="true" className="h-px w-6 bg-brand-gold/60" />
                                  {ingredient.tag}
                                </p>
                              )}
                              <h3 className="font-serif text-[21px] leading-snug text-[#222] sm:text-[24px]">
                                {ingredient.name}
                                {ingredient.origin && (
                                  <>
                                    {" "}
                                    <span className="text-brand-gold-dark">({ingredient.origin})</span>
                                  </>
                                )}
                              </h3>
                              <p className="mt-2.5 font-system text-[15px] leading-[1.75] text-[#555] sm:text-[16px]">
                                {ingredient.text}
                              </p>
                            </div>
                          </article>
                        </Reveal>
                      ))}
                    </div>
                    )}

                    {/* Organic badge sits directly above this line (only products that have one). */}
                    {detail.calmingLine && (
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
                    )}

                    {/* The five badges are 100×100 PNGs, so they're capped near that size to stay sharp. */}
                    {detail.trust && (
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
                    )}
                  </>
                ),
              },
                  ]
                : []),
              // How to use: only for products that have steps.
              ...(detail.usage
                ? [
                    {
                      id: "usage",
                      label: "Usage Instructions",
                      content: (
                        <>
                          <p className="font-sans text-[12px] font-semibold tracking-[3px] text-brand-gold-dark uppercase sm:text-[13px]">
                            {detail.usage.eyebrow}
                          </p>
                          <h2 className="mt-3 font-serif text-[28px] leading-tight font-medium text-[#222] sm:text-[36px]">
                            {detail.usage.title}
                          </h2>
                          <span aria-hidden="true" className="mt-3 block h-[3px] w-14 rounded-full bg-brand-gold" />

                          <ol className="mt-9 max-w-[760px]">
                            {detail.usage.steps.map((step, index) => (
                              <li
                                key={step.label}
                                className="grid grid-cols-[auto_1fr] gap-x-5 border-b border-[#efe5c9] py-5 first:pt-0 last:border-b-0"
                              >
                                <span
                                  aria-hidden="true"
                                  className="grid h-10 w-10 place-items-center rounded-full bg-[#fbf4df] font-sans text-[13px] font-semibold text-brand-gold-dark ring-1 ring-[#C89B3C]/50"
                                >
                                  {String(index + 1).padStart(2, "0")}
                                </span>
                                <div>
                                  <h3 className="font-sans text-[12px] font-semibold tracking-[2.5px] text-brand-gold-dark uppercase">
                                    {step.label}
                                  </h3>
                                  <p className="mt-1.5 font-system text-[16px] leading-[1.7] text-[#444] sm:text-[17px]">
                                    {step.text}
                                  </p>
                                </div>
                              </li>
                            ))}
                          </ol>

                          {detail.usage.guide && (
                            <div className="mt-12 max-w-[760px] md:mt-14">
                              <h2 className="font-serif text-[24px] leading-tight font-medium text-[#222] sm:text-[30px]">
                                {detail.usage.guide.title}
                              </h2>
                              <ul className="mt-5 space-y-3">
                                {detail.usage.guide.items.map((item) => (
                                  <li
                                    key={item.name}
                                    className="rounded-2xl border border-[#eadcb6] bg-white px-5 py-4 shadow-[0_14px_30px_-24px_rgba(120,85,20,0.5)]"
                                  >
                                    <h3 className="font-serif text-[19px] leading-snug text-[#222] sm:text-[21px]">
                                      {item.name}
                                    </h3>
                                    <p className="mt-1.5 font-system text-[15px] leading-[1.7] text-[#555] sm:text-[16px]">
                                      {item.text}
                                    </p>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {detail.usage.tip && (
                            <div className="relative mt-8 max-w-[760px] overflow-hidden rounded-2xl border border-[#eadcb6] bg-[#fbf8ef] py-5 pr-6 pl-7">
                              <span
                                aria-hidden="true"
                                className="absolute inset-y-4 left-0 w-[3px] rounded-full bg-brand-gold"
                              />
                              <p className="font-sans text-[12px] font-semibold tracking-[2.5px] text-brand-gold-dark uppercase">
                                {detail.usage.tipLabel ?? "Tip"}
                              </p>
                              <p className="mt-1.5 font-system text-[16px] leading-[1.7] text-[#444] sm:text-[17px]">
                                {detail.usage.tip}
                              </p>
                            </div>
                          )}

                          {detail.usage.suitableFor && (
                            <div className="mt-12 max-w-[760px] md:mt-14">
                              <h2 className="font-serif text-[24px] leading-tight font-medium text-[#222] sm:text-[30px]">
                                {detail.usage.suitableFor.title}
                              </h2>
                              <p className="mt-3 font-system text-[16px] leading-[1.75] text-[#555]">
                                {detail.usage.suitableFor.intro}
                              </p>
                              <ul className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                                {detail.usage.suitableFor.points.map((point) => (
                                  <li
                                    key={point}
                                    className="flex items-start gap-3 font-system text-[15px] leading-snug text-[#3b3226] sm:text-[16px]"
                                  >
                                    <span className="mt-0.5 shrink-0 text-brand-gold-dark">
                                      <CheckIcon className="h-4 w-4" />
                                    </span>
                                    {point}
                                  </li>
                                ))}
                              </ul>
                              {detail.usage.suitableFor.outro && (
                                <p className="mt-5 font-system text-[16px] leading-[1.75] text-[#555]">
                                  {detail.usage.suitableFor.outro}
                                </p>
                              )}
                            </div>
                          )}
                        </>
                      ),
                    },
                  ]
                : []),
              {
                id: "reviews",
                label: `Reviews (${rating.count})`,
                content: (
                  <>
                    <SectionTitle>Reviews</SectionTitle>
                    <div className="mt-8 flex max-w-[760px] flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-[#eadcb6] bg-[#fbf8ef] px-6 py-6">
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
                      <p className="font-system text-[16px] text-[#444]">
                        {rating.count === 0
                          ? "There are no reviews yet."
                          : `Rated ${rating.value} out of 5 based on ${reviewLabel}.`}
                      </p>
                    </div>
                  </>
                ),
              },
              // FAQ: only for products that have questions.
              ...(detail.faqs
                ? [
                    {
                      id: "faq",
                      label: "FAQ",
                      content: (
                        <>
                          <SectionTitle>Frequently asked questions</SectionTitle>

                          {/* Native <details>: opens and closes without any script. */}
                          <div className="mt-9 max-w-[880px] space-y-3">
                            {detail.faqs.map((faq) => (
                              <details
                                key={faq.question}
                                className="group rounded-2xl bg-white shadow-[0_14px_30px_-24px_rgba(120,85,20,0.5)] ring-1 ring-[#eadcb6] open:ring-[#C89B3C]/60"
                              >
                                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-5 py-4 font-serif text-[17px] leading-snug text-[#222] marker:content-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold sm:px-6 sm:py-5 sm:text-[19px] [&::-webkit-details-marker]:hidden">
                                  {faq.question}
                                  <svg
                                    aria-hidden="true"
                                    viewBox="0 0 24 24"
                                    className="h-5 w-5 shrink-0 fill-none stroke-brand-gold-dark group-open:rotate-180"
                                    strokeWidth="2.2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="m6 9 6 6 6-6" />
                                  </svg>
                                </summary>
                                <p className="px-5 pb-5 font-system text-[15px] leading-[1.8] text-[#555] sm:px-6 sm:pb-6 sm:text-[16px]">
                                  {faq.answer}
                                </p>
                              </details>
                            ))}
                          </div>
                        </>
                      ),
                    },
                  ]
                : []),
            ]}
          />
        </div>
      </section>

      {/* ───────── Related products ───────── */}
      {related.length > 0 && (
        <section id="related" className="border-t border-[#efe5c9]">
          <div className="mx-auto max-w-[1290px] px-5 py-14 sm:px-6 md:py-20">
            <SectionTitle>Related products</SectionTitle>

            {/* Phones/tablets: swipe sideways. Desktop: one row in five equal
                columns; with three or fewer products the row is as wide as
                three of those columns, so the cards keep the same size. */}
            <ul
              // `relative`: the cards' sr-only price text is absolutely
              // positioned, and a scroll container only clips it (instead of
              // letting it widen the page) if it is also its positioning parent.
              className={`relative -mx-5 mt-10 flex snap-x snap-mandatory scroll-pl-5 gap-4 overflow-x-auto px-5 pb-4 [scrollbar-width:none] sm:-mx-6 sm:scroll-pl-6 sm:gap-6 sm:px-6 lg:mx-0 lg:grid lg:overflow-visible lg:px-0 lg:pb-0 ${
                related.length > 3 ? "lg:grid-cols-5" : "lg:w-[60%] lg:grid-cols-3"
              }`}
            >
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
