import type { Metadata } from "next";
import Image from "next/image";
import { Footer } from "@/components/Footer";
import { ShopProducts } from "@/components/ShopProducts";
import { shopProducts } from "@/data/products";

export const metadata: Metadata = {
  title: "Shop | Bhumi Blend Organics",
  description:
    "Browse the complete Bhumi Blend Organics collection — Ayurvedic skin care, hair care, body care and combo sets crafted with nature.",
};

export default function ShopPage() {
  return (
    <>
      <main>
        {/* Banner: the picture is the background; title and intro sit over its
            plain middle, clear of the jar (left) and the model (right). */}
        <section className="relative isolate h-[270px] overflow-hidden bg-[#4a3b36] md:h-[400px]">
          <Image
            src="/shop-banner-copy-1.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="-z-10 object-cover object-center"
          />
          <div className="mx-auto flex h-full max-w-[1330px] flex-col items-center px-6 pt-[62px] text-center text-white md:pt-[92px]">
            <h1 className="font-serif text-[28px] leading-none font-bold tracking-[0.5px] uppercase md:text-[36px]">
              Products
            </h1>
            <p className="mt-10 max-w-[300px] font-system text-[15px] leading-relaxed md:mt-[72px] md:max-w-[470px] md:text-[18px] md:leading-[27px]">
              Discover the complete Bhumi Blend Organics collection — crafted with nature,
              powered by Ayurveda.
            </p>
          </div>
        </section>

        <ShopProducts products={shopProducts} />
      </main>
      <Footer />
    </>
  );
}
