import { bestSellers } from "@/data/products";
import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";

export function BestSellers() {
  return (
    <section id="best-sellers" className="bg-brand-cream">
      <div className="mx-auto max-w-[1290px] px-6 pt-10 pb-20 md:pb-24">
        {/* Heading — same wording and type as the live site. */}
        <div className="px-5 pt-5 pb-9 text-center">
          <p className="mb-3 inline-block font-sans text-[12px] font-semibold tracking-[3px] text-[#C89B3C] uppercase">
            Bhumi Blend Favorites
          </p>
          <h2 className="mb-2.5 font-serif text-[32px] leading-[1.2] font-medium text-[#222] sm:text-[40px]">
            Best Sellers
          </h2>
          <p className="mx-auto max-w-[620px] font-sans text-[15px] leading-[1.7] text-[#777]">
            Our most loved Ayurvedic essentials
          </p>
        </div>

        {/* 2 columns on phones/tablets, 4 on desktop — all 8 visible, no scrolling. */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-14">
          {bestSellers.map((product, index) => (
            <Reveal key={product.slug} delay={(index % 4) * 120} className="h-full">
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
